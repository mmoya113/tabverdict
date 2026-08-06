<p align="center">
  <img src="assets/icons/icon.svg" width="96" alt="Logo de TabVerdict">
</p>

<h1 align="center">TabVerdict</h1>

<p align="center">
  <strong>Compara con pruebas, no por sensaciones.</strong><br>
  Convierte pestañas de productos en una decisión privada, ponderada y verificable.
</p>

<p align="center"><a href="README.md">English</a> · <a href="https://mmoya113.github.io/tabverdict/">Demo</a> · <a href="PRIVACY.md">Privacidad</a></p>

![TabVerdict comparando productos con fuentes y criterios ponderados](assets/readme/landing.png)

## En diez segundos ⚡

TabVerdict es una extensión local para comparar productos de tiendas diferentes sin depender de rankings patrocinados. Captura una página, suma precio, envío, impuestos y comisiones, decide qué criterios te importan y calcula un ganador mostrando la fórmula y la fuente de cada dato.

- Sin cuenta.
- Sin servidor.
- Sin enlaces de afiliado.
- Sin puntuaciones misteriosas de IA.
- Con exportación a Markdown, CSV, JSON y un prompt preparado para IA.

## Lo que ya funciona ✅

- 🧲 Captura del producto al pulsar la extensión.
- 🧾 Lectura de `schema.org/Product`, `Offer` y `AggregateRating`.
- 🔗 Procedencia por dato: URL, método y etiqueta.
- 💸 Coste real con envío, impuestos fijos/porcentuales y comisiones.
- 🎚️ Criterios propios, pesos, unidades y dirección “más/menos es mejor”.
- 🧮 Ranking transparente y porcentaje de datos completos.
- 📉 Historial local al volver a capturar un precio distinto.
- ↩️ Edición, borrado con deshacer e importación de copias.
- 📤 Exportaciones generadas dentro del navegador.
- 📱 Interfaz responsive, accesible y con movimiento reducido.

## Instalar en un minuto 🧩

1. Descarga y descomprime el repositorio o ejecuta:

   ```bash
   git clone https://github.com/mmoya113/tabverdict.git
   ```

2. Abre `chrome://extensions` —o `edge://extensions` en Edge—.
3. Activa **Modo de desarrollador**.
4. Pulsa **Cargar descomprimida** y elige la carpeta `tabverdict`.
5. Fija la extensión. Abre un producto y pulsa el icono de TabVerdict.

No necesitas compilar ni ejecutar `npm install`.

## Cómo usarlo de verdad 🛒

1. Abre los productos que estés considerando.
2. Captura cada uno desde el popup.
3. Revisa los datos: si la web no ofrecía datos estructurados, TabVerdict lo indica.
4. Añade envío, impuestos y comisiones.
5. Crea criterios como autonomía, peso, garantía o reparabilidad.
6. Ajusta sus pesos y comprueba cómo cambia el ganador.
7. Abre las fuentes y completa los huecos.
8. Exporta el resultado o pide a una IA que cuestione tu decisión con el prompt incluido.

## La puntuación no se inventa 🧮

Cada criterio se normaliza de 0 a 100 entre los productos conocidos. Después se calcula la media ponderada. Un dato ausente aporta cero y reduce la cobertura; TabVerdict no rellena nada con una suposición. Si todos tienen el mismo valor, todos empatan a 100 en ese criterio porque no sirve para separarlos.

La implementación se puede auditar en [`src/lib/core.js`](src/lib/core.js) y sus pruebas están en [`tests/core.test.js`](tests/core.test.js).

## Privacidad 🔐

La extensión no solicita acceso permanente a todas las webs. `activeTab` permite leer sólo la página que eliges después de pulsar el icono. El tablero se guarda en `chrome.storage.local`; no hay base de datos remota, analítica ni perfil de compra.

Consulta [PRIVACY.md](PRIVACY.md) y [SECURITY.md](SECURITY.md) para los detalles completos.

## Límites honestos 🚧

- Algunas tiendas ocultan o renderizan datos de forma difícil de extraer; TabVerdict pide revisión en vez de fingir certeza.
- No convierte divisas automáticamente.
- El historial de precio se actualiza al capturar, no vigila tiendas en segundo plano.
- Compara un máximo de ocho opciones para mantener el tablero legible.
- La versión actual está preparada para navegadores Chromium; Firefox está en la hoja de ruta.

## Desarrollo

```bash
npm test
npm run validate
npm run check
npm run package
```

Lee [CONTRIBUTING.md](CONTRIBUTING.md) antes de enviar un cambio. Los fallos de seguridad se deben comunicar mediante [GitHub Security Advisories](https://github.com/mmoya113/tabverdict/security/advisories/new).

## Licencia

[MIT](LICENSE) © 2026 colaboradores de TabVerdict.

---

<p align="center"><strong>Tus criterios. Tus pruebas. Tu veredicto.</strong></p>
