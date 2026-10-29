import type { Metadata } from "next";
import { LegalPage, type LegalDoc } from "../legal-page";

export const metadata: Metadata = { title: "Privacy policy" };

const en: LegalDoc = {
  title: "Privacy policy",
  updated: "Last updated: October 29, 2026",
  sections: [
    {
      heading: "Who we are",
      body: [
        "Customatic is an open-source feedback tool built by Pedro Dreyer (Loopers, Buenos Aires, Argentina). This policy covers the hosted version at customatic.vercel.app. If you run Customatic on your own server, you are responsible for the data on it.",
        "Contact: pedrojdreyer@gmail.com.",
      ],
    },
    {
      heading: "What we collect",
      body: [
        "Account data: your name, email address and, if you sign in with Google or GitHub, the basic profile those services share (name, email, profile picture). We never receive your Google or GitHub password.",
        "Feedback sent through the widget: the message, the type (problem, idea or comment), the email address if the person leaves one, an optional screenshot, the page address, the browser, operating system, device type, screen size and language, and any extra fields the website owner chooses to attach.",
        "Technical data: a session cookie to keep you signed in, a cookie that remembers your language, and the IP address used to limit abuse. IP addresses are stored only as a one-way hash.",
      ],
    },
    {
      heading: "How we use it",
      body: [
        "To run the service: show feedback to the team that owns each app, send the replies they write, send team invitations and keep accounts secure.",
        "We don't sell personal data, we don't show ads and we don't use the data to train AI models.",
      ],
    },
    {
      heading: "Who can see it",
      body: [
        "Feedback is visible only to the members of the workspace that owns the app. Ideas published on a public roadmap show only the title chosen by the team and the vote count.",
        "The service runs on Vercel (hosting) and Neon (database). They process data on our behalf to provide the service.",
      ],
    },
    {
      heading: "How long we keep it",
      body: [
        "Data is kept while the account or app exists. Deleting an app deletes all its feedback and screenshots. To delete your account or any data about you, write to pedrojdreyer@gmail.com and we'll do it within 30 days.",
      ],
    },
    {
      heading: "Your rights",
      body: [
        "You can ask for a copy of your data, correct it or delete it by writing to pedrojdreyer@gmail.com. If you sent feedback to a website that uses Customatic, you can also contact that website directly.",
      ],
    },
  ],
};

const es: LegalDoc = {
  title: "Política de privacidad",
  updated: "Última actualización: 29 de octubre de 2026",
  sections: [
    {
      heading: "Quiénes somos",
      body: [
        "Customatic es una herramienta open source para recibir comentarios, hecha por Pedro Dreyer (Loopers, Buenos Aires, Argentina). Esta política cubre la versión publicada en customatic.vercel.app. Si instalás Customatic en tu propio servidor, sos responsable de los datos que guardes ahí.",
        "Contacto: pedrojdreyer@gmail.com.",
      ],
    },
    {
      heading: "Qué datos guardamos",
      body: [
        "Datos de la cuenta: tu nombre, tu email y, si ingresás con Google o GitHub, el perfil básico que comparten esos servicios (nombre, email y foto). Nunca recibimos tu contraseña de Google o GitHub.",
        "Comentarios enviados desde el widget: el mensaje, el tipo (problema, idea o comentario), el email si la persona lo deja, una captura opcional, la dirección de la página, el navegador, el sistema operativo, el tipo de dispositivo, el tamaño de pantalla, el idioma y los datos extra que decida adjuntar el dueño del sitio.",
        "Datos técnicos: una cookie de sesión para mantenerte conectado, una cookie que recuerda tu idioma y la dirección IP, que se usa para frenar abusos. La IP se guarda solo como un hash que no se puede revertir.",
      ],
    },
    {
      heading: "Para qué los usamos",
      body: [
        "Para que el servicio funcione: mostrar los comentarios al equipo dueño de cada app, enviar las respuestas que escriben, mandar invitaciones al equipo y mantener las cuentas seguras.",
        "No vendemos datos personales, no mostramos publicidad y no usamos los datos para entrenar modelos de IA.",
      ],
    },
    {
      heading: "Quién los ve",
      body: [
        "Los comentarios los ven solo los miembros del espacio de trabajo dueño de la app. Las ideas publicadas en un roadmap público muestran solo el título que elige el equipo y la cantidad de votos.",
        "El servicio funciona sobre Vercel (hosting) y Neon (base de datos), que procesan los datos por cuenta nuestra para prestar el servicio.",
      ],
    },
    {
      heading: "Cuánto tiempo los guardamos",
      body: [
        "Mientras exista la cuenta o la app. Al eliminar una app se borran todos sus comentarios y capturas. Para borrar tu cuenta o cualquier dato tuyo, escribí a pedrojdreyer@gmail.com y lo hacemos en un plazo de 30 días.",
      ],
    },
    {
      heading: "Tus derechos",
      body: [
        "Podés pedir una copia de tus datos, corregirlos o borrarlos escribiendo a pedrojdreyer@gmail.com. Si mandaste un comentario a un sitio que usa Customatic, también podés contactar a ese sitio directamente.",
      ],
    },
  ],
};

export default function PrivacyPage() {
  return <LegalPage docs={{ en, es }} />;
}
