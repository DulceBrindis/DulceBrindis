// Ejecutar todo solo cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  // 👉 Número de WhatsApp (lo sigues usando en el FORMULARIO normal)
  const WHATSAPP_NUMBER = '5939999999999';

  // 👉 URL del GRUPO de WhatsApp (ENLACE COMPLETO tal como te lo da WhatsApp)
  const WHATSAPP_GROUP_URL = 'https://chat.whatsapp.com/GAmJZmjlEeQJH4E6mycisr';

  // 👉 Cambia esto por la URL de tu Apps Script Web App (la que termina en /exec)
  const GOOGLE_SCRIPT_URL =
    'https://script.google.com/macros/s/AKfycbx3k2uxWUXxMW3nhD85cRBuTAdD7OTSgJSJMmF-f1lTwo1p7YGYl9ohrPZqig9VUHrBaw/exec';

  // Definición de combos y precios
  const combos = {
    degustacion: {
      nombre:
        'Combo Degustación · 1 vino reserva + snacks clásicos (2 personas)',
      precio: 39.99,
    },
    amigos: {
      nombre:
        'Combo Amigos · 2 vinos reserva + snacks grandes (4–5 personas)',
      precio: 69.99,
    },
    premium: {
      nombre:
        'Combo Premium · vino reserva + vino blanco + tabla gourmet (ocasiones especiales)',
      precio: 89.99,
    },
  };

  // 📌 Referencias a elementos del DOM
  const btnComprarHero = document.getElementById('btnComprarHero');
  const comboSelect = document.getElementById('combo');
  const precioHero = document.getElementById('precioHero');
  const precioActual = document.getElementById('precioActual');
  const resumenProducto = document.getElementById('resumenProducto');
  const formCompra = document.getElementById('formCompra');
  const resumenCliente = document.getElementById('resumenCliente');
  const qrCanvas = document.getElementById('qrCanvas');

  // --- BOTÓN "VER OPCIONES DE COMBOS" ---
  // Hace scroll suave hasta la sección de combos
  if (btnComprarHero) {
    btnComprarHero.addEventListener('click', (event) => {
      event.preventDefault(); // por si algún día lo cambias a <a>

      const combosSection = document.getElementById('lista-combos');
      if (combosSection) {
        combosSection.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      }
    });
  }

  // 👉 Actualizar precios y texto del combo seleccionado
  function actualizarCombo() {
    if (!comboSelect) return;

    const key = comboSelect.value;
    const combo = combos[key];
    if (!combo) return;

    const precioTexto = `$${combo.precio.toFixed(2)}`;

    if (precioHero) precioHero.textContent = precioTexto;
    if (precioActual) precioActual.textContent = precioTexto;
    if (resumenProducto) {
      resumenProducto.innerHTML = `${combo.nombre} — <strong>${precioTexto}</strong>`;
    }
  }

  if (comboSelect) {
    comboSelect.addEventListener('change', actualizarCombo);
    // Inicializar al cargar
    actualizarCombo();
  }

  // 👉 Enviar pedido a Google Sheets
  function enviarPedidoAGoogleSheet(payload) {
    if (!GOOGLE_SCRIPT_URL) return;

    fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors', // no necesitamos leer respuesta
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(payload),
    }).catch((err) => {
      console.error('Error al enviar a Google Sheets:', err);
    });
  }

  // 👉 Generar/actualizar QR con la URL de WhatsApp
  function actualizarQR(url) {
    if (!qrCanvas || typeof QRCode === 'undefined') return;

    const ctx = qrCanvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, qrCanvas.width, qrCanvas.height);
    }

    QRCode.toCanvas(qrCanvas, url, { width: 200 }, function (error) {
      if (error) console.error(error);
    });
  }

  // 👉 Manejo del formulario: validar + guardar + abrir WhatsApp + QR
  if (formCompra && resumenCliente && comboSelect) {
    formCompra.addEventListener('submit', (event) => {
      event.preventDefault(); // no recargar la página

      const nombre = /** @type {HTMLInputElement} */ (
        document.getElementById('nombre')
      ).value.trim();
      const email = /** @type {HTMLInputElement} */ (
        document.getElementById('email')
      ).value.trim();
      const whatsapp = /** @type {HTMLInputElement} */ (
        document.getElementById('whatsapp')
      ).value.trim();
      const comentarios = /** @type {HTMLInputElement} */ (
        document.getElementById('comentarios')
      ).value.trim();

      // Validaciones básicas
      if (!nombre || !email || !whatsapp) {
        alert('Por favor completa nombre, email y WhatsApp.');
        return;
      }

      const comboClave = comboSelect.value;
      const combo = combos[comboClave];

      if (!combo) {
        alert('Por favor selecciona un combo válido.');
        return;
      }

      // Actualizamos el resumen en pantalla
      resumenCliente.textContent =
        `Cliente: ${nombre} | Email: ${email} | WhatsApp: ${whatsapp}` +
        (comentarios ? ` | Comentarios: ${comentarios}` : '');

      // Construimos el mensaje para WhatsApp (se usa solo para el chat directo)
      const mensaje = `
Hola, quiero confirmar un pedido de combos de vino 🍷

Combo seleccionado:
- ${combo.nombre}
- Precio: $${combo.precio.toFixed(2)}

Mis datos:
- Nombre: ${nombre}
- Email: ${email}
- WhatsApp: ${whatsapp}
${comentarios ? `- Comentarios: ${comentarios}\n` : ''}

¿Me ayudas a validar el pedido y coordinar el pago/entrega?
      `.trim();

      // URL de WhatsApp con mensaje prellenado (chat directo, no grupo)
      const waUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
        mensaje
      )}`;

      // 1) Guardar en Google Sheet
      const payload = {
        comboClave,
        comboNombre: combo.nombre,
        precio: combo.precio,
        nombre,
        email,
        whatsapp,
        comentarios,
        origen: 'web-dulce-brindis',
      };
      enviarPedidoAGoogleSheet(payload);

      // 2) Actualizar código QR en la tarjeta de resumen
      actualizarQR(waUrl);

      // 3) Preguntar si quiere abrir WhatsApp ahora
      const continuar = confirm(
        'Hemos registrado tu pedido y generado un QR de WhatsApp.\n\n¿Quieres abrir WhatsApp ahora para enviar el mensaje?'
      );

      if (continuar) {
        window.location.href = waUrl;
      }
    });
  }

  // 👉 Botones "Elegir este combo" → abrir GRUPO de WhatsApp para cotizar
  const botonesElegir = document.querySelectorAll('.btn-elegir-combo');
  console.log('Botones .btn-elegir-combo encontrados:', botonesElegir.length);

  if (botonesElegir.length > 0) {
    botonesElegir.forEach((btn, index) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault(); // por si es <a href="#">
        const comboNombre =
          btn.dataset.comboNombre ||
          btn.closest('.combo-card')?.querySelector('h4')?.textContent.trim() ||
          'Combo Dulce Brindis';

        console.log(`Click en botón de combo #${index + 1}:`, comboNombre);

        // Redirigir al grupo de WhatsApp
        window.location.href = WHATSAPP_GROUP_URL;
      });
    });
  } else {
    console.warn('No se encontró ningún botón con la clase .btn-elegir-combo');
  }

  console.log('script de Dulce Brindis cargado ✔');
});
