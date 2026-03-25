class KitchenController < ApplicationController
  def dashboard
    render inertia: "kitchen/Dashboard"
  end
end
