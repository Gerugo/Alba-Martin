# 👗 Botika Libre - AI Fashion Studio (100% Gratuito)

Segunda webapp dentro del repositorio, diseñada para replicar el pipeline completo de **Botika.com** en un entorno de coste cero.

---

## ⚡ Cómo ejecutar las dos aplicaciones en paralelo

Desde la raíz del repositorio puedes levantar ambas aplicaciones de forma independiente:

- **Webapp Original (Demo de pago con Fal.ai):**
  ```bash
  npm run dev
  ```
  *(Se abre en `http://localhost:5173`)*

- **Segunda Webapp Gratuita (Botika Libre):**
  ```bash
  npm run dev:free
  ```
  *(Se abre en `http://localhost:5174`)*

---

## 🎯 Capacidades de Botika incluidas (100% Gratis)

1. **De Prenda Plana / Percha a Modelo Real:**
   - Sube cualquier foto de prenda (flat-lay, percha o maniquí).
   - El sistema optimiza y comprime en el navegador sin saturar memoria.

2. **Galería Diversa de Modelos IA (Botika Studio):**
   - Diversidad de etnias: Latina/Mediterránea, Caucásica, Afro, Asiática.
   - Diversidad de fisonomías: Estándar, Curvy, Atlética.
   - Femenino y Masculino.
   - Opción para vestir a una dependienta o modelo propia de la tienda.

3. **Entornos y Fondos de Estudio:**
   - Estudio Blanco Minimalista
   - Boutique de Lujo
   - Exterior París / Milán
   - Sol Mediterráneo
   - Loft Industrial Chic
   - Jardín Botánico

4. **3 Motores Gratuitos Integrados:**
   - **Hugging Face Spaces (`@gradio/client`):** Invocación directa de IDM-VTON en la nube sin necesidad de tener GPU propia.
   - **Google Colab Free GPU T4:** Cuaderno interactivo listo en [`colab/botika_vton_backend.ipynb`](./colab/botika_vton_backend.ipynb) que levanta un servidor privado con túnel Cloudflare ilimitado.
   - **Modo Simulación:** Previsualización instantánea con presets de muestra sin consumir red.

5. **Herramientas de E-Commerce & Venta:**
   - Generación de Título comercial, SKU y Descripción HTML con el Free Tier de Gemini 2.5 Flash.
   - Exportación de catálogo completo a **Shopify (.CSV)**.
   - Botón directo de **Reserva por WhatsApp**.
   - Descarga de fotografías HD y copia de post con emojis para Instagram.
