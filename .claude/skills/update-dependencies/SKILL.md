---
name: update-dependencies
description: Update Ruby gems and npm packages to their latest versions for the Maebashi table-order app. Use whenever the user says "依存関係を更新して", "依存関係をアップデート", asks to run bundle update / ncu, or asks to update gems or npm packages. Runs bundle update --all and npx npm-check-updates -u, validates with rubocop / brakeman / rails test / npm run check, rolls back on failure, and creates two separate commits matching the project convention (gem パッケージをアップデート / npm パッケージをアップデート).
---

# 依存関係更新スキル

This skill updates the Ruby gems and npm packages of the Maebashi table-order app to their latest versions. Each package manager gets its own validated commit, mirroring the existing project convention. On any validation failure, the working tree is rolled back so the repository is never left in a broken intermediate state.

## 前提条件

Before doing anything, verify the working tree is clean:

```bash
git status --porcelain
```

If output is non-empty, stop and tell the user to commit or stash their changes first. Rollback assumes a clean baseline — running on top of dirty state would `git checkout --` the user's in-progress work.

Do **not** create a feature branch. The recent project convention is to land these directly on the current branch.

## ステップ 1 — gem の更新

### 1.1 更新前のスナップショット

Save the pre-update gem versions so the commit message can list what actually changed:

```bash
cp Gemfile.lock /tmp/Gemfile.lock.before
```

### 1.2 bundle update を実行

```bash
bundle update --all
```

`--all` is required: without it Bundler emits a deprecation warning, and Bundler 3 will refuse to update everything unless the flag is passed.

If `Gemfile.lock` is unchanged after this (compare with `/tmp/Gemfile.lock.before`), nothing was outdated — skip the rest of step 1 and move to step 2. Tell the user "gem は最新でした".

### 1.3 検証

Run the checks in this order — fail fast on cheap checks before paying for the test suite:

1. `bin/rubocop`
2. `bin/brakeman -q --no-pager`
3. `bin/rails test`

Any non-zero exit is a failure. Capture the failing command's output for the report.

### 1.4 失敗時のロールバック

If any check failed:

```bash
git checkout -- Gemfile.lock
```

Then report to the user: which validation failed, the relevant tail of its output, and the gem(s) most likely responsible (cross-reference the failing test/file with the diff captured earlier). **Stop the skill** — do not proceed to npm. The user needs to decide whether to pin a gem, fix code, or skip this update.

### 1.5 成功時のコミット

Build the commit body from the lockfile diff. Each line in `Gemfile.lock` like `    gemname (1.2.3)` represents a resolved version; pair the `-` and `+` lines:

```bash
diff /tmp/Gemfile.lock.before Gemfile.lock \
  | awk '/^[<>] {4}[a-z0-9_-]+ \(/ { gsub(/[()]/, ""); print $1, $2, $3 }'
```

Format each entry as `- gemname OLD → NEW` (full-width arrow `→`, matching the existing commits). Skip dependencies whose only change is a checksum or platform line.

`Gemfile.lock` だけをステージする (`-a` は使わない — 他のファイルを巻き込まないため):

```bash
git add Gemfile.lock
```

次に、コミット作成は `serial-commit` スキルに委ねる。 `serial-commit` は author date のチェックを行うので、このスキル内で `git commit` を直接実行しない。 `serial-commit` を呼び出すときに、以下の形式の本文を使うよう伝える:

```
gem パッケージをアップデート
- gemA X.Y.Z → A.B.C
- gemB X.Y.Z → A.B.C
```

`Co-Authored-By` トレーラーは付けない (`serial-commit` の規約に従う)。

## ステップ 2 — npm の更新

### 2.1 ncu でバージョン引き上げ

`npx npm-check-updates -u` rewrites `package.json` to the latest versions, **including major bumps**, and prints the diff. Capture stdout — it's the source of truth for the commit message body:

```bash
npx npm-check-updates -u | tee /tmp/ncu.out
```

If ncu reports "All dependencies match the latest package versions", skip to the final report — there is nothing to update.

### 2.2 lockfile と node_modules を更新

```bash
npm install
```

### 2.3 検証

```bash
npm run check
```

This runs the TypeScript type check (`tsc` for both app and node configs). A non-zero exit means a major version bump introduced an incompatible type — that's the most common failure mode here, especially for `@types/react`, `typescript`, or `vite`.

### 2.4 失敗時のロールバック

```bash
git checkout -- package.json package-lock.json
npm install
```

The second `npm install` re-syncs `node_modules` to the restored lockfile. Report the failing output to the user along with which packages bumped majors (parse `/tmp/ncu.out`) — those are the prime suspects. The gem commit from step 1 stays in place; it was already validated.

### 2.5 成功時のコミット

Parse `/tmp/ncu.out` for lines of the form `pkgname  ^X.Y.Z  →  ^A.B.C` and reformat as `- pkgname X.Y.Z → A.B.C` (drop the `^` / `~` prefix to match the existing commits' style).

`package.json` と `package-lock.json` だけをステージする:

```bash
git add package.json package-lock.json
```

ステップ 1.5 と同様に、コミット作成は `serial-commit` スキルに委ねる。本文の形式:

```
npm パッケージをアップデート
- pkgA X.Y.Z → A.B.C
- pkgB X.Y.Z → A.B.C
```

`Co-Authored-By` トレーラーは付けない。

## 最終報告

End with a short summary in Japanese:

- gem: コミット作成 (`<short-sha>`) / 変更なし / 失敗 (理由)
- npm: コミット作成 (`<short-sha>`) / 変更なし / 失敗 (理由)

Do **not** push. The user reviews the diffs locally and pushes themselves — that's the convention here, and it gives them a chance to catch a major bump that passed type-check but might still be risky in the browser.

## 重要な制約

**コミットは必ず2つに分ける。** Mixing gem and npm changes in one commit makes bisecting a future regression much harder. The existing history (`gem パッケージをアップデート` / `npm パッケージをアップデート` as separate commits) reflects this — preserve the pattern even if both updates are tiny.

**ステップ 1 が失敗したらステップ 2 に進まない。** A broken Ruby side means tests can't validate anything downstream — running npm updates on top would just compound the problem.

**ロールバックは `git checkout --` で行う。** Never `git reset --hard` or `git stash drop` — those can wipe unrelated state. The precondition check at the top guarantees only the lockfiles / package.json are dirty, so a targeted checkout is sufficient and safe.

**`bundle install` を `bundle update --all` の代わりに使わない。** `bundle install` only resolves missing gems against the existing lockfile; it does not bump versions. The user's intent ("依存関係を更新して") requires `bundle update --all`.
