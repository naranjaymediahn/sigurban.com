import { ref, computed } from "vue";

const LOCALE_KEY = "sulafbc_locale";

const translations = {
    es: {
        nav: {
            home: "INICIO",
            products: "PRODUCTOS",
            whereToBuy: "¿DÓNDE COMPRAR?",
            blog: "BLOG",
            recipes: "RECETAS",
            contact: "CONTÁCTENOS",
            distributor: "SEA DISTRIBUIDOR",
            languageShort: "EN",
            switchTo: "Switch to English",
        },
        common: {
            loading: "Cargando...",
            send: "ENVIAR",
            sending: "Enviando...",
            save: "Guardar",
            cancel: "Cancelar",
            emailPlaceholder: "Correo electrónico",
            readRecipe: "VER LA RECETA",
            seeMoreBlog: "VER BLOG",
        },
        hero: {
            slides: [
                {
                    title: "CREMA AUTÉNTICA HECHA EN CENTROAMÉRICA",
                    alt: "Crema Sula auténtica hecha en Centroamérica",
                },
                {
                    title: "FIESTAS DE SABORES Y DELICIOSAS FRUTAS",
                    alt: "Jugos Sula manzana, naranja y ponche de frutas",
                },
                {
                    title: "TRES SABORES QUE SON UNA DELICIA NATURAL EN TU MESA",
                    alt: "Néctares Sula de sabores naturales",
                },
                {
                    title: "MALTEADAS EN TRES DELICIOSOS SABORES",
                    alt: "Malteadas Sula vainilla, chocolate y fresa",
                },
            ],
        },
        home: {
            seoTitle: "SULAFBC | Productos Sula en Estados Unidos",
            seoDescription:
                "SULAFBC conecta distribuidores, negocios y comunidades con auténticos productos hondureños Sula en Estados Unidos. Conoce productos, recetas y cómo convertirte en distribuidor.",
            seoHeading: "SULAFBC:",
            seoSubtitle: "Productos Sula para distribuidores en Estados Unidos",
            seoText:
                "Conectamos a distribuidores, negocios y comunidades con auténticos productos hondureños Sula. En este sitio puedes conocer nuestros productos, explorar recetas y solicitar información para convertirte en distribuidor oficial.",
            joinEyebrow: "ÚNETE HOY",
            joinTitle: "Sé un distribuidor",
            joinText:
                "Únete a nuestra red de distribuidores y lleva auténticos productos hondureños a tu comunidad. Llena el formulario y descubre cómo puedes ser parte de nuestra misión de compartir los sabores de Honduras en Estados Unidos.",
            joinStrong: "¡Impulsa tu negocio con nosotros hoy mismo!",
            joinButton: "LLENAR FORMULARIO",
            productsEyebrow: "EXPLORA",
            productsTitle: "Nuestros Productos",
            recipesEyebrow: "EXPLORA LAS",
            recipesTitle: "Recetas con nuestros productos",
            recipesEmpty: "Todavía no hay recetas publicadas.",
            recipesMore: "VER MÁS RECETAS",
            certificationsTitle: "CERTIFICACIONES",
            certifications: [
                {
                    badge: "FDA",
                    image: "/images/certificados/fda.png",
                    text: "Cumple plenamente con las regulaciones de la Administración de Alimentos y Medicamentos de los Estados Unidos (FDA), garantizando que nuestros productos satisfacen los estrictos estándares nacionales de seguridad y calidad alimentaria.",
                },
                {
                    badge: "FSSC<br>22000",
                    image: "/images/certificados/logofssc.png",
                    text: "Certificados bajo el marco FSSC 22000, reconocido a nivel mundial, lo que demuestra nuestro compromiso con una gestión integral de la seguridad alimentaria y con operaciones seguras en la cadena de suministro.",
                },
                {
                    badge: "HACCP<br><span>CERTIFIED</span>",
                    image: "/images/certificados/haccp.png",
                    text: "Implementación de sistemas de Análisis de Peligros y Puntos Críticos de Control (HACCP) en nuestras operaciones UHT, asegurando una gestión eficaz de los riesgos en seguridad alimentaria.",
                },
                {
                    badge: "SQF",
                    image: "/images/certificados/sqf.png",
                    text: "Avanzando hacia la certificación Safe Quality Food (SQF) para nuestras plantas de UHT y sólidos lácteos.",
                },
                {
                    badge: "ISO<br>17025",
                    image: "/images/certificados/iso_17025.png",
                    text: "Nuestro laboratorio de la División Norte de SULA está acreditado para el análisis de productos lácteos y leche cruda, garantizando resultados de pruebas fiables, precisos y reconocidos a nivel internacional.",
                },
            ],
            socialEyebrow: "ASPECTO SOCIAL",
            socialTitle: "RESPONSABILIDAD SOCIAL EMPRESARIAL",
            socialText:
                "Cada vez que compras nuestros productos, estás promoviendo el desarrollo sostenible de más de 2,000 granjas lecheras en Honduras. Nuestra leche proviene exclusivamente de pequeños productores que han crecido con nosotros, que han recibido nuestra asistencia técnica y financiera y que son el primer eslabón de nuestra cadena de valor. Estas granjas producen la mejor leche de Honduras, que se utiliza como ingrediente principal de nuestros productos.",
            contactEyebrow: "NOS ENCANTARÍA ESTAR EN",
            contactTitle: "CONTACTO CONTIGO",
            whatsapp: "Contáctanos por WhatsApp",
            emailSuccess: "Correo enviado con éxito",
            emailError: "Error al enviar el correo",
            emailRequired: "Por favor ingresa un correo electrónico",
        },
        blog: {
            title: "Blog",
            readMore: "Leer más",
            backToBlog: "← Volver al blog",
            noPosts: "No hay publicaciones aún.",
            category: "Categoría",
            postNotFound: "Post no encontrado.",
            relatedProduct: "Producto relacionado",
            visitRecipe: "IR A LA RECETA",
        },
        whereToBuy: {
            heading: "ENCUENTRA NUESTROS PRODUCTOS DE",
            amazonEyebrow: "TAMBIÉN DISPONIBLE EN",
            formTitle: "¡Escríbenos! Estamos listos para servirte",
            formEmail: "Email",
            formCompany: "Empresa",
            formSubject: "Asunto",
            formMessage: "Mensaje",
            contactLead:
                "¡Descubre lo auténtico, la calidad y la frescura! Contáctanos para obtener nuestros productos hoy.",
            contactTitle: "Contáctanos",
            contactText:
                "Nuestro equipo en Estados Unidos está listo para apoyarte.",
            formSuccess: "Formulario enviado con éxito",
            formError: "Error al enviar el formulario",
            formInvalid: "Por favor completa todos los campos correctamente",
        },
        footer: {
            about: "Estamos muy orgullosos de ser una empresa de distribución de alimentos y bebidas dedicada a ofrecer productos de la máxima calidad elaborados por empresas socialmente responsables. Nuestra misión es obtener los mejores alimentos de todo el mundo y llevarlos al mercado estadounidense, garantizando un sabor excepcional y unos estándares sin concesiones.",
        },
        distributor: {
            formTitle: "Solicitud para ser Distribuidor",
            businessName: "Nombre del negocio",
            contactName: "Nombre del contacto",
            address: "Dirección",
            state: "Estado",
            phone: "Celular",
            email: "Email",
            products: "¿En cuáles productos estás interesado?",
            cancel: "Cancelar",
            confirm: "Confirmar",
            submitted: "¡Formulario enviado!",
            contactSoon: "Nos pondremos en contacto contigo pronto.",
            success: "Formulario enviado con éxito",
            error: "Error al enviar el formulario",
            required: "Obligatorio",
            invalidEmail: "Email inválido",
            completeFields: "Completa todos los campos",
        },
    },
    en: {
        nav: {
            home: "HOME",
            products: "PRODUCTS",
            whereToBuy: "WHERE TO BUY?",
            blog: "BLOG",
            recipes: "RECIPES",
            contact: "CONTACT US",
            distributor: "BECOME A DISTRIBUTOR",
            languageShort: "ES",
            switchTo: "Cambiar a Español",
        },
        common: {
            loading: "Loading...",
            send: "SEND",
            sending: "Sending...",
            save: "Save",
            cancel: "Cancel",
            emailPlaceholder: "Email address",
            readRecipe: "VIEW RECIPE",
            seeMoreBlog: "VIEW BLOG",
        },
        hero: {
            slides: [
                {
                    title: "AUTHENTIC CREAM MADE IN CENTRAL AMERICA",
                    alt: "Authentic Sula cream made in Central America",
                },
                {
                    title: "A FIESTA OF FLAVORS AND DELICIOUS FRUITS",
                    alt: "Sula apple, orange and fruit punch juices",
                },
                {
                    title: "THREE FLAVORS THAT ARE A NATURAL DELIGHT AT YOUR TABLE",
                    alt: "Sula nectars with natural flavors",
                },
                {
                    title: "MILKSHAKES IN THREE DELICIOUS FLAVORS",
                    alt: "Sula vanilla, chocolate and strawberry milkshakes",
                },
            ],
        },
        home: {
            seoTitle: "SULAFBC | Sula Products in the United States",
            seoDescription:
                "SULAFBC connects distributors, businesses and communities with authentic Honduran Sula products in the United States. Explore products, recipes and distributor opportunities.",
            seoHeading: "SULAFBC:",
            seoSubtitle: "Sula products for distributors in the United States",
            seoText:
                "We connect distributors, businesses and communities with authentic Honduran Sula products. Here you can discover our products, explore recipes and request information to become an official distributor.",
            joinEyebrow: "JOIN TODAY",
            joinTitle: "Become a distributor",
            joinText:
                "Join our distributor network and bring authentic Honduran products to your community. Fill out the form and discover how you can be part of our mission of sharing the flavors of Honduras across the United States.",
            joinStrong: "Grow your business with us today!",
            joinButton: "FILL OUT FORM",
            productsEyebrow: "EXPLORE",
            productsTitle: "Our Products",
            recipesEyebrow: "EXPLORE OUR",
            recipesTitle: "Recipes with our products",
            recipesEmpty: "There are no published recipes yet.",
            recipesMore: "VIEW MORE RECIPES",
            certificationsTitle: "CERTIFICATIONS",
            certifications: [
                {
                    badge: "FDA",
                    image: "/images/certificados/fda.png",
                    text: "Fully compliant with United States Food and Drug Administration (FDA) regulations, ensuring our products meet strict national food safety and quality standards.",
                },
                {
                    badge: "FSSC<br>22000",
                    image: "",
                    text: "Certified under the globally recognized FSSC 22000 framework, demonstrating our commitment to comprehensive food safety management and secure supply chain operations.",
                },
                {
                    badge: "HACCP<br><span>CERTIFIED</span>",
                    image: "/images/certificados/haccp.png",
                    text: "Implementation of Hazard Analysis and Critical Control Point (HACCP) systems in our UHT operations, ensuring effective food safety risk management.",
                },
                {
                    badge: "SQF",
                    image: "/images/certificados/sqf.png",
                    text: "Advancing toward Safe Quality Food (SQF) certification for our UHT and dairy solids plants.",
                },
                {
                    badge: "ISO<br>17025",
                    image: "/images/certificados/iso_17025.png",
                    text: "Our SULA North Division laboratory is accredited for dairy product and raw milk analysis, guaranteeing reliable, accurate and internationally recognized test results.",
                },
            ],
            socialEyebrow: "SOCIAL IMPACT",
            socialTitle: "CORPORATE SOCIAL RESPONSIBILITY",
            socialText:
                "Every time you buy our products, you support the sustainable development of more than 2,000 dairy farms in Honduras. Our milk comes exclusively from small producers who have grown with us, received our technical and financial support, and form the first link in our value chain. These farms produce the finest milk in Honduras, which becomes the main ingredient in our products.",
            contactEyebrow: "WE WOULD LOVE TO STAY IN",
            contactTitle: "TOUCH WITH YOU",
            whatsapp: "Contact us on WhatsApp",
            emailSuccess: "Email submitted successfully",
            emailError: "There was an error submitting your email",
            emailRequired: "Please enter an email address",
        },
        blog: {
            title: "Blog",
            readMore: "Read more",
            backToBlog: "← Back to blog",
            noPosts: "No posts yet.",
            category: "Category",
            postNotFound: "Post not found.",
            relatedProduct: "Related product",
            visitRecipe: "GO TO RECIPE",
        },
        footer: {
            about: "We are proud to be a food and beverage distribution company dedicated to offering top-quality products made by socially responsible companies. Our mission is to source the best foods from around the world and bring them to the U.S. market with exceptional flavor and uncompromising standards.",
        },
        distributor: {
            formTitle: "Distributor Application",
            businessName: "Business name",
            contactName: "Contact name",
            address: "Address",
            state: "State",
            phone: "Phone",
            email: "Email",
            products: "Which products are you interested in?",
            cancel: "Cancel",
            confirm: "Submit",
            submitted: "Form submitted!",
            contactSoon: "We will be in touch with you soon.",
            success: "Form submitted successfully",
            error: "There was an error submitting the form",
            required: "Required",
            invalidEmail: "Invalid email",
            completeFields: "Complete all fields",
        },
        whereToBuy: {
            heading: "FIND OUR PRODUCTS FROM",
            amazonEyebrow: "ALSO AVAILABLE ON",
            formTitle: "Write to us! We are ready to help you",
            formEmail: "Email",
            formCompany: "Company",
            formSubject: "Subject",
            formMessage: "Message",
            contactLead: "Discover authenticity, quality and freshness. Contact us to get our products today.",
            contactTitle: "Contact us",
            contactText: "Our team in the United States is ready to support you.",
            formSuccess: "Form submitted successfully",
            formError: "There was an error submitting the form",
            formInvalid: "Please complete all fields correctly",
        },
    },
};

export type Locale = "es" | "en";

const locale = ref<Locale>("es");

function detectLocale(): Locale {
    if (typeof window === "undefined") return "es";
    const saved = localStorage.getItem(LOCALE_KEY) as Locale;
    if (saved === "es" || saved === "en") return saved;
    return "es";
}

export function useLocale() {
    const t = computed(() => translations[locale.value]);

    function setLocale(value: Locale) {
        locale.value = value;
        if (typeof window !== "undefined") {
            localStorage.setItem(LOCALE_KEY, value);
        }
    }

    function initLocale() {
        locale.value = detectLocale();
    }

    return { locale, t, setLocale, initLocale };
}
