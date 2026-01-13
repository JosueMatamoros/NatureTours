// src/data/tours.js
import {
  FiSun,
  FiShield,
  FiCheckCircle,
  FiUsers,
  FiDroplet,
} from "react-icons/fi";

export const TOURS = {
  1: {
    id: 1,
    name: "Night Walk Tour",
    duration: "2 hours",
    price: 45,
    oldPrice: 55,
    currency: "$",
    per: "/ person",
    images: [
      "/tours/night-walk-tour.jpg",
      "/tours/night-walk-2.jpg",
      "/tours/night-walk-3.jpg",
      "/tours/night-walk-4.jpg",
    ],
    about: [
      "Guided night walk designed to observe wildlife that only appears after dark.",
      "Includes an experienced guide and a safe walk along natural forest trails.",
    ],
    routes: [
      "Tropical forest trails with observation stops along the way.",
      "Relaxed pace with explanations about local flora and fauna.",
    ],
    highlights: [
      "Bilingual guide",
      "Flashlight included",
      "Wildlife observation",
    ],
    recommendations: [
      { icon: FiSun, title: "Sun protection", text: "In case you arrive early." },
      { icon: FiShield, title: "Insect repellent", text: "Highly recommended." },
      { icon: FiCheckCircle, title: "Closed-toe shoes", text: "For a comfortable walk." },
      { icon: FiUsers, title: "Comfortable clothing", text: "Lightweight, but covering." },
      { icon: FiDroplet, title: "Optional", text: "Water and a light rain jacket." },
    ],
  },

  2: {
    id: 2,
    name: "Horseback Riding Tour",
    duration: "2 hours",
    price: 30,
    oldPrice: null,
    currency: "$",
    per: "/ person",
    images: [
      "/booking/horse/image1.JPG",
      "/booking/horse/image2.JPG",
      "/booking/horse/image3.JPG",
      "/booking/horse/image4.JPG",
      "/booking/horse/image5.JPG",
      "/booking/horse/image6.JPG",
    ],
    about: [
      "This horseback riding tour lasts approximately two hours, although the exact duration may vary depending on the pace of the group and the time spent enjoying the ride, taking breaks, and appreciating the surrounding natural beauty.",
      "Before the tour begins, we offer a light snack with fresh fruit or local treats, as well as tastings of natural juices or local liqueurs, depending on availability. During the ride, we make stops to enjoy the scenery, get comfortable with the horses, or relax near the rivers.",
    ],
    routes: [
      "The tour follows several types of trails, ranging from wide gravel paths to narrower forest trails surrounded by nature. We also pass through local farms where you may see wildlife and agricultural areas.",
      "We offer multiple route options depending on weather conditions and our recommendations. Some routes are very relaxed, while others include muddier sections for those looking for a bit of adventure. When conditions allow, there may be opportunities to cross rivers and explore additional trails.",
    ],
    highlights: [
      "Peaceful routes",
      "Lush forest scenery",
      "River crossings (weather permitting)",
    ],
    recommendations: [
      { icon: FiSun, title: "Sun protection", text: "Sunscreen and a hat if you wish." },
      { icon: FiShield, title: "Insect repellent", text: "Especially useful in forested areas." },
      { icon: FiCheckCircle, title: "Closed-toe shoes", text: "Sneakers or boots for added safety." },
      { icon: FiUsers, title: "Long pants recommended", text: "Jeans or leggings for better comfort." },
      { icon: FiDroplet, title: "Optional", text: "Water bottle and an extra change of clothes if the weather is rainy." },
    ],
  },
};
