class WelcomeController < ApplicationController
  def index
    render inertia: "Welcome", props: {
      app_name: "Table Order App"
    }
  end
end
