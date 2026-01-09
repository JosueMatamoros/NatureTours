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
    duration: "2 horas",
    price: 45,
    oldPrice: 55,
    currency: "$",
    per: "/ persona",
    images: [
      "/tours/night-walk-tour.jpg",
      "/tours/night-walk-2.jpg",
      "/tours/night-walk-3.jpg",
      "/tours/night-walk-4.jpg",
    ],
    about: [
      "Caminata nocturna guiada para observar fauna que solo aparece de noche.",
      "Incluye guía experto y recorrido seguro por senderos naturales.",
    ],
    routes: [
      "Senderos en bosque tropical con paradas de observación.",
      "Ritmo tranquilo con explicación de flora y fauna.",
    ],
    highlights: ["Guía bilingüe", "Linterna incluida", "Observación de vida silvestre"],
    recommendations: [
      { icon: FiSun, title: "Protección solar", text: "Por si llegas temprano." },
      { icon: FiShield, title: "Repelente", text: "Altamente recomendado." },
      { icon: FiCheckCircle, title: "Zapatos cerrados", text: "Para caminar cómodo." },
      { icon: FiUsers, title: "Ropa cómoda", text: "Ligera, pero que cubra." },
      { icon: FiDroplet, title: "Opcional", text: "Agua y capa liviana." },
    ],
  },

  2: {
    id: 2,
    name: "Horseback Riding Tour",
    duration: "2 horas",
    price: 0,
    oldPrice: null,
    currency: "$",
    per: "/ persona",
    images: [
      "/horseBac-tour.JPG",
      "/horseBac-tour.JPG",
      "/horseBac-tour.JPG",
      "/horseBac-tour.JPG",
    ],
    about: [
      "Este tour a caballo tiene una duración aproximada de 2 horas, aunque puede variar según el ritmo del grupo y el tiempo que deseen tomar para disfrutar del recorrido, hacer pausas y apreciar las bellezas naturales del entorno.",
      "Antes de iniciar, ofrecemos un refrigerio con frutas o bocadillos nacionales, además de degustaciones de jugos o licores nacionales según disponibilidad. Durante el recorrido realizamos pausas para que puedan disfrutar los paisajes, familiarizarse con los caballos o incluso acercarse a disfrutar de los ríos.",
    ],
    routes: [
      "El tour recorre múltiples senderos de distintos tipos: desde caminos amplios de piedra hasta senderos más estrechos rodeados de naturaleza en zona boscosa. También pasamos por fincas con fauna y agricultura local.",
      "Contamos con varias rutas que pueden elegirse con base en nuestra recomendación y el clima. Hay opciones muy tranquilas, y también rutas con más lodo para quienes buscan un toque de adrenalina. Dependiendo de las condiciones del clima, al pasar cerca de los ríos, existe la posibilidad de cruzarlos y realizar senderos adicionales.",
    ],
    highlights: ["Rutas tranquilas", "Naturaleza boscosa", "Cruce de ríos (según clima)"],
    recommendations: [
      { icon: FiSun, title: "Protección solar", text: "Bloqueador y gorra si lo deseas." },
      { icon: FiShield, title: "Repelente", text: "Especialmente útil en zonas boscosas." },
      { icon: FiCheckCircle, title: "Zapatos cerrados", text: "Tenis o botas para mayor seguridad." },
      { icon: FiUsers, title: "Pantalón recomendado", text: "Jeans o licra para más comodidad." },
      { icon: FiDroplet, title: "Opcional", text: "Botella de agua y una muda extra si el clima está lluvioso." },
    ],
  },
};
