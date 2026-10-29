import type { Metadata } from "next";
import { LegalPage, type LegalDoc } from "../legal-page";

export const metadata: Metadata = { title: "Terms of use" };

const en: LegalDoc = {
  title: "Terms of use",
  updated: "Last updated: October 29, 2026",
  sections: [
    {
      heading: "The service",
      body: [
        "Customatic lets website owners collect feedback from their users and manage it in a shared inbox. The hosted version at customatic.vercel.app is free and provided as is, without guarantees of availability. The source code is published under the MIT license.",
      ],
    },
    {
      heading: "Your account",
      body: [
        "Keep your sign-in details safe. You're responsible for what happens in your workspace and for the apps you create.",
      ],
    },
    {
      heading: "Using the widget on your site",
      body: [
        "If you install the widget, you're responsible for telling your visitors that you collect feedback, and for the extra data you attach to reports. Don't use Customatic to collect passwords, payment details or sensitive personal data.",
        "Don't use the service for spam, abuse or anything illegal. We may suspend accounts or apps that do.",
      ],
    },
    {
      heading: "Liability",
      body: [
        "To the extent the law allows, we're not liable for data loss, interruptions or indirect damages. Keep your own copy of anything important.",
      ],
    },
    {
      heading: "Changes and contact",
      body: [
        "We may update these terms; the date above shows the latest version. Questions: pedrojdreyer@gmail.com.",
      ],
    },
  ],
};

const es: LegalDoc = {
  title: "Términos de uso",
  updated: "Última actualización: 29 de octubre de 2026",
  sections: [
    {
      heading: "El servicio",
      body: [
        "Customatic permite a los dueños de sitios web recibir comentarios de sus usuarios y gestionarlos en una bandeja compartida. La versión publicada en customatic.vercel.app es gratuita y se ofrece tal como está, sin garantías de disponibilidad. El código fuente se publica con licencia MIT.",
      ],
    },
    {
      heading: "Tu cuenta",
      body: [
        "Cuidá tus datos de ingreso. Sos responsable de lo que pase en tu espacio de trabajo y de las apps que crees.",
      ],
    },
    {
      heading: "Usar el widget en tu sitio",
      body: [
        "Si instalás el widget, sos responsable de avisarles a tus visitantes que recibís comentarios y de los datos extra que adjuntes a cada reporte. No uses Customatic para pedir contraseñas, datos de pago ni datos personales sensibles.",
        "No uses el servicio para spam, abusos ni nada ilegal. Podemos suspender cuentas o apps que lo hagan.",
      ],
    },
    {
      heading: "Responsabilidad",
      body: [
        "En la medida que lo permita la ley, no somos responsables por pérdida de datos, interrupciones ni daños indirectos. Guardá tu propia copia de lo que sea importante.",
      ],
    },
    {
      heading: "Cambios y contacto",
      body: [
        "Podemos actualizar estos términos; la fecha de arriba indica la última versión. Consultas: pedrojdreyer@gmail.com.",
      ],
    },
  ],
};

export default function TermsPage() {
  return <LegalPage docs={{ en, es }} />;
}
