import React, { Component } from "react";
import PayPalCheckout from "../components/payment/PaypalCheckout";
import ReserveTourCard from "../components/payment/ReserveTourCard";
import TourOverviewCard from "../components/payment/TourOverviewCard";

export default class Checkout extends Component {
  render() {
    return (
      <div className="flex">
        <TourOverviewCard />
        <ReserveTourCard />
      </div>
    );
  }
}
