# 🚀 Backend Gratuito en Google Colab para Botika Libre

Este directorio contiene el script y cuaderno para ejecutar el motor de **Virtual Try-On (VTON)** de forma 100% gratuita utilizando una **GPU Nvidia T4 (16GB VRAM)** en Google Colab.

---

### ¿Por qué Google Colab?
- **Coste 0 €**: No requiere suscripciones a Fal.ai, FASHN ni saldo en tarjetas de crédito.
- **Túnel Cloudflare Ilimitado**: No requiere cuentas ni tokens de ngrok; genera una URL segura `https://xxx.trycloudflare.com` accesible desde cualquier navegador.
- **Rendimiento**: Procesa imágenes de alta resolución en ~10-15 segundos.

---

### Instrucciones de uso en 3 pasos:

1. **Abrir Google Colab:**
   - Ve a [colab.research.google.com](https://colab.research.google.com).
   - Haz clic en **Subir cuaderno** y selecciona el archivo `botika_vton_backend.ipynb` de esta carpeta.

2. **Activar la GPU gratuita:**
   - En el menú superior: `Entorno de ejecución` > `Cambiar tipo de entorno de ejecución`.
   - Selecciona **T4 GPU** y pulsa **Guardar**.

3. **Ejecutar y conectar:**
   - Pulsa `Ctrl + F9` (o `Entorno de ejecución` > `Ejecutar todo`).
   - Al final de la última celda aparecerá una línea como:
     ```text
     https://tu-identificador-random.trycloudflare.com
     ```
   - Abre la webapp `botika-free`, abre **Ajustes** (icono de sliders arriba a la derecha), selecciona el motor **Google Colab GPU T4** y pega esa URL.
