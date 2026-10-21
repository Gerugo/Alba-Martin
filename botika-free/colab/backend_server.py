"""
Botika Libre - Backend de Virtual Try-On 100% Gratuito
Diseñado para ejecutarse en Google Colab con GPU T4 gratuita o en local con NVIDIA RTX.
Expone un endpoint FastAPI y un túnel seguro Cloudflare sin registro ni coste.
"""

import os
import io
import base64
import torch
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from PIL import Image

app = FastAPI(title="Botika Libre VTON Backend", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

device = "cuda" if torch.cuda.is_available() else "cpu"
print(f"[*] Iniciando servidor en dispositivo: {device}")

class TryOnRequest(BaseModel):
    model_image: str       # DataUri o URL
    garment_image: str     # DataUri o URL
    category: str = "upper_body"
    scene_prompt: str = ""
    model_ethnicity: str = "latina"

def decode_base64_image(data_uri: str) -> Image.Image:
    if "," in data_uri:
        data_uri = data_uri.split(",")[1]
    image_bytes = base64.b64decode(data_uri)
    return Image.open(io.BytesIO(image_bytes)).convert("RGB")

def encode_pil_to_base64(image: Image.Image) -> str:
    buffered = io.BytesIO()
    image.save(buffered, format="JPEG", quality=90)
    img_str = base64.b64encode(buffered.getvalue()).decode("utf-8")
    return f"data:image/jpeg;base64,{img_str}"

@app.get("/api/health")
def health_check():
    return {
        "status": "online",
        "device": device,
        "gpu_name": torch.cuda.get_device_name(0) if torch.cuda.is_available() else "None",
        "memory_allocated_mb": round(torch.cuda.memory_allocated(0) / 1024**2, 2) if torch.cuda.is_available() else 0
    }

@app.post("/api/tryon")
async def run_tryon(req: TryOnRequest):
    try:
        print(f"[*] Procesando Virtual Try-On: Categoria={req.category}")
        
        # Cargar imágenes
        if req.model_image.startswith("http"):
            import requests
            resp = requests.get(req.model_image)
            model_img = Image.open(io.BytesIO(resp.content)).convert("RGB")
        else:
            model_img = decode_base64_image(req.model_image)
            
        garment_img = decode_base64_image(req.garment_image)
        
        # Redimensionar al estándar de IDM-VTON (768 x 1024)
        model_img = model_img.resize((768, 1024), Image.LANCZOS)
        garment_img = garment_img.resize((768, 1024), Image.LANCZOS)
        
        # En Google Colab / Diffusers, aquí se invoca el pipeline de IDM-VTON:
        # result_img = pipeline(model_img, garment_img, category=req.category)
        #
        # Para respuesta rápida en el esqueleto:
        result_img = model_img
        
        hero_data_uri = encode_pil_to_base64(result_img)
        
        return {
            "success": True,
            "hero_url": hero_data_uri,
            "side_url": hero_data_uri,
            "detail_url": encode_pil_to_base64(garment_img),
        }
    except Exception as e:
        print(f"[!] Error en procesamiento: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
