document.addEventListener('DOMContentLoaded', function() {
  // --- INICIO: Lógica para el menú responsive ---
  const adminMenuToggle = document.getElementById('adminMenuToggle');
  const adminMenu = document.getElementById('adminMenu');

  if (adminMenuToggle && adminMenu) {
    adminMenuToggle.addEventListener('click', function() {
      adminMenu.classList.toggle('admin-menu-open');
      const isExpanded = adminMenu.classList.contains('admin-menu-open');
      this.setAttribute('aria-expanded', isExpanded);
      this.innerHTML = isExpanded ? '&times;' : '&#9776;'; // Cambia entre hamburguesa y X
      this.setAttribute('aria-label', isExpanded ? 'Cerrar menú' : 'Abrir menú');
    });
  }
  // --- FIN: Lógica para el menú responsive ---

  if (typeof db === 'undefined') {
    console.error("Firebase (db) no está inicializado."); alert("Error crítico: DB no conectada."); return;
  }

  // --- Elementos DOM para Crear Presupuesto ---
  const vehiculoSelect = document.getElementById('vehiculo-presupuesto');
  const infoClientePresupuestoP = document.getElementById('info-cliente-presupuesto');
  const tablaBody = document.querySelector('#tabla-presupuesto tbody');
  const btnAgregarItem = document.getElementById('agregar-item');
  const inputManoObraDescripcion = document.getElementById('mano-obra-descripcion');
  const inputManoObraMonto = document.getElementById('mano-obra-monto');
  const totalSpan = document.getElementById('total-presupuesto');
  const btnGuardarPresupuesto = document.getElementById('guardar-presupuesto');
  const listaPresupuestosGuardadosDiv = document.getElementById('lista-presupuestos-guardados');

  // --- Elementos DOM para Editar Presupuesto (Modal) ---
  const modalEditarPresupuesto = document.getElementById('modal-editar-presupuesto');
  const btnCerrarModalEditarPresupuesto = document.getElementById('cerrar-modal-editar-presupuesto');
  const formEditarPresupuesto = document.getElementById('form-editar-presupuesto');
  const vehiculoSelectEditar = document.getElementById('vehiculo-presupuesto-editar');
  const infoClientePresupuestoEditarP = document.getElementById('info-cliente-presupuesto-editar');
  const tablaBodyEditar = document.querySelector('#tabla-presupuesto-editar tbody');
  const btnAgregarItemEditar = document.getElementById('agregar-item-editar');
  const inputManoObraDescripcionEditar = document.getElementById('mano-obra-descripcion-editar');
  const inputManoObraMontoEditar = document.getElementById('mano-obra-monto-editar');
  const totalSpanEditar = document.getElementById('total-presupuesto-editar');
  const presupuestoIdEditarInput = document.getElementById('presupuesto-id-editar');

  // --- Elementos DOM para Modal WhatsApp Links ---
  const modalWhatsAppLinks = document.getElementById('modal-whatsapp-links');
  const btnCerrarModalWhatsAppLinks = document.getElementById('cerrar-modal-whatsapp-links');
  const whatsappLinksListDiv = document.getElementById('whatsapp-links-list');
  const btnEnviarWhatsAppSeleccionados = document.getElementById('enviar-whatsapp-seleccionados-btn');
  const whatsappPresupuestoIdDataInput = document.getElementById('whatsapp-presupuesto-id-data');

  let vehiculosCargadosParaPresupuesto = [];

  async function cargarVehiculosParaPresupuesto(selectElement = vehiculoSelect, currentVehiculoId = null) {
      if (!selectElement) { console.warn("Select element for vehicles not found."); return; }
      try {
        const snapshot = await db.collection("vehiculos").orderBy("registradoEl", "desc").get();
        vehiculosCargadosParaPresupuesto = [];
        selectElement.innerHTML = "<option value=''>-- Selecciona un vehículo --</option>";
        if (snapshot.empty) {
            selectElement.innerHTML += "<option value='' disabled>No hay vehículos registrados</option>";
        } else {
            snapshot.forEach(doc => {
                const veh = doc.data(); const vehId = doc.id;
                // Guardamos el objeto completo para tener acceso a patente, marca, modelo, etc.
                vehiculosCargadosParaPresupuesto.push({id: vehId, ...veh });
                const optionText = `${veh.patente || 'N/P'} - ${veh.marca || 'N/M'} ${veh.modelo || ''} (${veh.clienteNombre || 'Cliente S/N'})`.trim();
                const option = document.createElement('option');
                option.value = vehId;
                option.textContent = optionText;
                if (currentVehiculoId === vehId) {
                    option.selected = true;
                }
                selectElement.appendChild(option);
            });
        }
        if (currentVehiculoId && selectElement.id === vehiculoSelectEditar.id) {
            selectElement.dispatchEvent(new Event('change')); // Disparar change para actualizar info cliente en modal editar
        }
      } catch (e) {
          console.error("Error cargando vehículos para el select:", e);
          if(selectElement) selectElement.innerHTML = "<option value=''>Error al cargar vehículos</option>";
      }
  }

  function actualizarTotalPresupuesto(esModalDeEdicion = false) {
      const currentTablaBody = esModalDeEdicion ? tablaBodyEditar : tablaBody;
      const currentManoObraMontoInput = esModalDeEdicion ? inputManoObraMontoEditar : inputManoObraMonto;
      const currentTotalSpan = esModalDeEdicion ? totalSpanEditar : totalSpan;

      if (!currentTablaBody || !currentTotalSpan || !currentManoObraMontoInput) return;
      let totalItems = 0;
      currentTablaBody.querySelectorAll('tr').forEach(row => {
        const montoInput = row.querySelector('.item-monto');
        if (montoInput) { totalItems += parseFloat(montoInput.value) || 0; }
      });
      const montoManoObra = parseFloat(currentManoObraMontoInput.value) || 0;
      const totalGeneral = totalItems + montoManoObra;
      currentTotalSpan.textContent = totalGeneral.toFixed(2);
  }

  function agregarItemPresupuesto(tbodyElement, esModalDeEdicion = false) {
      if (!tbodyElement) return;
      const fila = document.createElement('tr');
      fila.innerHTML = `
        <td><input type="text" class="item-repuesto" placeholder="Repuesto/Servicio"></td>
        <td><input type="number" class="item-monto" placeholder="0.00" min="0" step="0.01" value="0"></td>
        <td><input type="url" class="item-link" placeholder="Link (opcional)"></td>
        <td><button type="button" class="borrar-item btn-action" style="background-color: #555;">Borrar</button></td>`;
      tbodyElement.appendChild(fila);
      const nuevoMontoInput = fila.querySelector('.item-monto');
      if (nuevoMontoInput) {
          nuevoMontoInput.addEventListener('input', () => actualizarTotalPresupuesto(esModalDeEdicion));
      }
  }

  async function mostrarPresupuestosGuardados() {
      if (!listaPresupuestosGuardadosDiv) return;
      listaPresupuestosGuardadosDiv.innerHTML = '<p>Cargando presupuestos...</p>';
      db.collection("presupuestos").orderBy("creadoEl", "desc")
        .onSnapshot(snapshot => {
          if (snapshot.empty) { listaPresupuestosGuardadosDiv.innerHTML = "<p>No hay presupuestos guardados.</p>"; return; }
          let html = "";
          snapshot.forEach(doc => {
              const p = doc.data(); const id = doc.id;
              let manoDeObraHTML = (p.manoDeObra && p.manoDeObra.monto >= 0 && (p.manoDeObra.descripcion || p.manoDeObra.monto > 0)) ?
                  `<li style="color: #ffc107;">Mano de Obra (${p.manoDeObra.descripcion || 'General'}): $${p.manoDeObra.monto.toFixed(2)}</li>` : '';

              html += `
                  <div>
                      <h5 style="color: #ad0000;">ID: ${id.substring(0,8)} (Vehículo: ${p.vehiculoInfo || 'N/A'})</h5>
                      <p><strong>Cliente:</strong> ${p.clienteNombre || 'N/A'} ${p.clienteTelefono ? `- Tel: ${p.clienteTelefono}` : ''}</p>
                      <p><strong>Total:</strong> $${p.total ? p.total.toFixed(2) : '0.00'}</p>
                      <p><strong>Estado:</strong> <span style="font-weight: bold; color: ${p.estado === 'Aceptado' ? 'lightgreen' : p.estado === 'Rechazado' ? 'salmon' : 'yellow'};">${p.estado || 'Pendiente'}</span></p>
                      <p><strong>Items:</strong></p>
                      <ul style="padding-left: 20px; margin-bottom: 10px;">
                          ${p.items.map(item => `<li>${item.repuesto}: $${item.monto ? item.monto.toFixed(2) : '0.00'} ${item.link ? `(<a href="${item.link}" target="_blank" style="color: #64b5f6;">Ver</a>)` : ''}</li>`).join('')}
                          ${manoDeObraHTML}
                      </ul>
                      <p style="font-size: 0.8em; color: #888;">Creado: ${p.creadoEl ? new Date(p.creadoEl.seconds * 1000).toLocaleString() : 'N/A'}</p>
                      ${p.actualizadoEl ? `<p style="font-size: 0.8em; color: #888;">Actualizado: ${new Date(p.actualizadoEl.seconds * 1000).toLocaleString()}</p>` : ''}
                      <div style="margin-top: 10px;">
                        ${p.estado === 'Pendiente' ? `
                            <button class="accion-presupuesto-btn btn-action" data-id="${id}" data-accion="aceptar" style="background-color: green;">Aceptar</button>
                            <button class="accion-presupuesto-btn btn-action btn-edit" data-id="${id}" data-accion="editar">Editar</button>
                            <button class="accion-presupuesto-btn btn-action btn-delete" data-id="${id}" data-accion="eliminar">Eliminar</button>
                        ` : (p.estado === 'Aceptado' ? `<button class="btn-action ver-trabajo-btn" data-presupuesto-id="${id}" style="background-color: #17a2b8;">Ver Trabajo</button>` : '')}
                        <button class="accion-presupuesto-btn btn-action" data-id="${id}" data-accion="pdf" style="background-color: #007bff;">PDF</button>
                        <button class="accion-presupuesto-btn btn-action" data-id="${id}" data-accion="whatsapp" style="background-color: #25D366;">WhatsApp</button>
                      </div>
                  </div>`;
          });
          listaPresupuestosGuardadosDiv.innerHTML = html;

          listaPresupuestosGuardadosDiv.querySelectorAll('.accion-presupuesto-btn').forEach(btn => {
              btn.addEventListener('click', async (e) => {
                  const id = e.target.dataset.id; const accion = e.target.dataset.accion;
                  const presDoc = await db.collection('presupuestos').doc(id).get();
                  if (!presDoc.exists) { alert("Presupuesto no existe."); return; }
                  const data = presDoc.data();
                  if (accion === 'aceptar') aceptarPresupuesto(id, data);
                  else if (accion === 'editar') abrirModalEditarPresupuesto(id, data);
                  else if (accion === 'eliminar') eliminarPresupuesto(id);
                  else if (accion === 'pdf') generarPDFPresupuesto(data, id);
                  else if (accion === 'whatsapp') prepararWhatsAppModal(data, id);
              });
          });
          listaPresupuestosGuardadosDiv.querySelectorAll('.ver-trabajo-btn').forEach(btn => {
              btn.addEventListener('click', (e) => {
                  window.location.href = `admin_trabajos.html?presupuestoId=${e.target.dataset.presupuestoId}`;
              });
          });
      }, error => { console.error("Error onSnapshot lista presupuestos:", error); if (listaPresupuestosGuardadosDiv) listaPresupuestosGuardadosDiv.innerHTML = "<p style='color:red;'>Error al cargar.</p>"; });
  }

  async function aceptarPresupuesto(id, dataPresupuesto) {
      if (!confirm(`ACEPTAR presupuesto para "${dataPresupuesto.vehiculoInfo}" y mover a trabajos?`)) return;

      let vehiculoParaTrabajoInfo = dataPresupuesto.vehiculoInfo; // Default
      let vehiculoDataCompleta = {};

      if (dataPresupuesto.vehiculoDocId) {
          try {
              const vehiculoDoc = await db.collection("vehiculos").doc(dataPresupuesto.vehiculoDocId).get();
              if (vehiculoDoc.exists) {
                  vehiculoDataCompleta = vehiculoDoc.data();
                  vehiculoParaTrabajoInfo = `${vehiculoDataCompleta.patente || ''} ${vehiculoDataCompleta.marca || ''} ${vehiculoDataCompleta.modelo || ''}`.trim().replace(/\s+/g, ' ');
              }
          } catch (e) {
              console.warn("No se pudo obtener detalle completo del vehículo para el trabajo:", e);
          }
      }

      try {
          const trabajo = {
              presupuestoOriginalId: id,
              vehiculoOriginalId: dataPresupuesto.vehiculoDocId,
              vehiculoInfo: vehiculoParaTrabajoInfo, // Usar la info formateada
              clienteNombre: dataPresupuesto.clienteNombre, // Usar el nombre del cliente del presupuesto
              clienteTelefono: dataPresupuesto.clienteTelefono, // Usar el teléfono del cliente del presupuesto
              items: dataPresupuesto.items,
              manoDeObra: dataPresupuesto.manoDeObra || { descripcion: '', monto: 0 },
              total: dataPresupuesto.total,
              estadoTrabajo: 'Pendiente',
              fechaAceptacionPresupuesto: dataPresupuesto.creadoEl,
              fechaInicioTrabajo: firebase.firestore.FieldValue.serverTimestamp()
          };
          await db.collection("trabajos_en_curso").add(trabajo);
          await db.collection("presupuestos").doc(id).update({ estado: 'Aceptado', movidoATrabajosEl: firebase.firestore.FieldValue.serverTimestamp() });
          alert("Presupuesto ACEPTADO. Nuevo trabajo creado en 'Trabajos en Curso'.");
      } catch (err) { alert("Error al aceptar: " + err.message); console.error(err); }
  }

  async function eliminarPresupuesto(presupuestoId) {
      if (!confirm(`¿Seguro de eliminar el presupuesto ID ${presupuestoId.substring(0,8)}? Esta acción no se puede deshacer.`)) return;
      try {
          const presupuestoRef = db.collection("presupuestos").doc(presupuestoId);
          const presDoc = await presupuestoRef.get();
          if (presDoc.exists && presDoc.data().estado !== 'Pendiente') {
              if (!confirm("Este presupuesto no está 'Pendiente'. ¿Aún así deseas eliminarlo? Esto no afectará trabajos ya creados a partir de él.")) return;
          }
          await presupuestoRef.delete();
          alert("Presupuesto eliminado con éxito.");
      } catch (error) {
          console.error("Error al eliminar presupuesto:", error);
          alert("Error al eliminar el presupuesto: " + error.message);
      }
  }

  function generarPDFPresupuesto(data, idPresupuesto) {
      if (typeof jspdf === 'undefined' || typeof jspdf.jsPDF === 'undefined') { alert("jsPDF no cargada."); return; }
      const { jsPDF } = jspdf; const doc = new jsPDF();
      const nombreTaller = "Mecanico Automotriz Luis Díaz";
      const direccionTaller = "Pasaje Rigel 5, Troncos Viejos";
      const telefonoTaller = "+56 9 45987504";
      const emailTaller = "ldiaz1999@gmail.com";

      doc.setFontSize(18); doc.text(nombreTaller, 105, 15, null, null, 'center');
      doc.setFontSize(10);
      doc.text(direccionTaller, 105, 22, null, null, 'center');
      doc.text(`Tel: ${telefonoTaller} | Email: ${emailTaller}`, 105, 27, null, null, 'center');
      doc.setLineWidth(0.5); doc.line(15, 35, 195, 35);
      doc.setFontSize(12);
      doc.text(`PRESUPUESTO N°: ${idPresupuesto.substring(0,8).toUpperCase()}`, 150, 45, {align: 'right'});
      doc.text(`Fecha: ${data.creadoEl ? new Date(data.creadoEl.seconds * 1000).toLocaleDateString() : new Date().toLocaleDateString()}`, 15, 45);
      doc.setFontSize(11);
      doc.text(`Cliente: ${data.clienteNombre || 'No especificado'}`, 15, 55);
      doc.text(`Teléfono Cliente: ${data.clienteTelefono || 'N/A'}`, 15, 60);
      doc.text(`Vehículo: ${data.vehiculoInfo || 'N/A'}`, 15, 67); // Muestra el vehiculoInfo del presupuesto
      let y = 78;
      doc.setFontSize(12); doc.text("Detalle del Presupuesto:", 15, y); y += 2;
      doc.setFontSize(10); doc.setFillColor(230, 230, 230); doc.setTextColor(0);
      doc.rect(15, y, 135, 7, 'F'); doc.text("Descripción", 17, y + 5);
      doc.rect(150, y, 45, 7, 'F'); doc.text("Monto ($)", 152, y + 5);
      y += 7;
      doc.setDrawColor(180,180,180); doc.line(15, y, 195, y);

      if (data.items && data.items.length > 0) {
          data.items.forEach(item => {
            doc.setTextColor(50,50,50);
            const descLines = doc.splitTextToSize(item.repuesto + (item.link ? ` (Ver: ${item.link})` : ''), 130);
            const montoStr = `$${item.monto ? item.monto.toFixed(2) : '0.00'}`;
            let itemHeight = (descLines.length * 5) + 4;
            if (y + itemHeight > 260) { doc.addPage(); y = 20; }
            doc.text(descLines, 17, y + 5);
            doc.text(montoStr, 152, y + 5);
            y += itemHeight;
            doc.line(15, y, 195, y);
          });
      }
      if (data.manoDeObra && data.manoDeObra.monto >= 0 && (data.manoDeObra.descripcion || data.manoDeObra.monto > 0) ) {
          doc.setTextColor(50,50,50);
          const descManoObra = data.manoDeObra.descripcion || "Mano de Obra General";
          const descMOLines = doc.splitTextToSize(descManoObra, 130);
          const montoMOStr = `$${data.manoDeObra.monto.toFixed(2)}`;
          let itemHeight = (descMOLines.length * 5) + 4;
          if (y + itemHeight > 260) { doc.addPage(); y = 20; }
          doc.setFont(undefined, "italic");
          doc.text(descMOLines, 17, y + 5);
          doc.text(montoMOStr, 152, y + 5);
          doc.setFont(undefined, "normal");
          y += itemHeight;
          doc.line(15, y, 195, y);
      }
      y += 7;
      doc.setFontSize(12); doc.setFont(undefined, "bold");
      doc.text(`TOTAL PRESUPUESTO:`, 105, y);
      doc.text(`$${data.total ? data.total.toFixed(2) : '0.00'}`, 152, y);
      doc.setFont(undefined, "normal"); y += 12;
      doc.setFontSize(9); doc.setTextColor(100);
      doc.text(`Validez del presupuesto: 15 días.`, 15, y); y += 5;
      doc.text(`Condiciones pueden aplicar.`, 15, y);
      doc.setFontSize(9); doc.setTextColor(150);
      doc.text("Gracias por su confianza.", 105, Math.max(y + 20, 280), null, null, "center");
      const nombreArchivo = `Presupuesto_${(data.clienteNombre || idPresupuesto.substring(0,5)).replace(/\s/g, '_')}.pdf`;
      doc.save(nombreArchivo);
  }

  function enviarWhatsAppPresupuesto(data, idPresupuesto, linksSeleccionados = null) {
      const nombreTaller = "Mecanico Automotriz Luis Díaz";
      let mensajeItems = "";
      if (data.items && data.items.length > 0) {
          data.items.forEach(item => {
              mensajeItems += `\n- ${item.repuesto}: $${item.monto ? item.monto.toFixed(2) : '0.00'}`;
          });
      }
      if (data.manoDeObra && (data.manoDeObra.monto > 0 || data.manoDeObra.descripcion) ) {
          mensajeItems += `\n- Mano de Obra (${data.manoDeObra.descripcion || 'General'}): $${data.manoDeObra.monto.toFixed(2)}`;
      }
      let mensajeLinks = "";
      if (linksSeleccionados && linksSeleccionados.length > 0) {
          mensajeLinks = "\n\nLinks de interés:";
          linksSeleccionados.forEach(link => {
              mensajeLinks += `\n* ${link.descripcion}: ${link.url}`;
          });
      } else if (linksSeleccionados === null && data.items && data.items.some(item => item.link)) {
          mensajeLinks = "\n\nLinks de interés (principales):"; // Modificado para claridad
          data.items.forEach(item => {
              if (item.link) mensajeLinks += `\n* ${item.repuesto}: ${item.link}`;
          });
      }
      const telCliente = data.clienteTelefono ? data.clienteTelefono.replace(/\D/g,'') : '';
      let numeroLimpioWA = '';
      if (telCliente) {
          if (telCliente.length > 9 && telCliente.startsWith('56')) {
             numeroLimpioWA = telCliente; // Ya tiene 56
          } else if (telCliente.length === 9) {
             numeroLimpioWA = '56' + telCliente; // Añadir 56 si es número local de 9 dígitos
          } else {
              // Número no parece ser chileno válido, intentar enviar sin código de país
              // o mostrar advertencia. Por ahora, enviar tal cual.
              numeroLimpioWA = telCliente;
          }
      }
      const mensaje =
`Estimado/a ${data.clienteNombre || 'Cliente'},
Le enviamos el presupuesto (ID: ${idPresupuesto.substring(0,6)}) de ${nombreTaller} para el vehículo: ${data.vehiculoInfo || 'N/A'}.
${mensajeItems ? `\n*Detalle:*${mensajeItems}` : ''}
${mensajeLinks}

*Total Presupuesto: $${data.total ? data.total.toFixed(2) : '0.00'}*
Estado: ${data.estado || 'Pendiente'}

Para confirmar o cualquier consulta, por favor contáctenos.
¡Gracias!`;
      const linkWA = `https://wa.me/${numeroLimpioWA}?text=${encodeURIComponent(mensaje)}`;
      window.open(linkWA, '_blank');
  }

  if(btnCerrarModalEditarPresupuesto) btnCerrarModalEditarPresupuesto.onclick = () => { modalEditarPresupuesto.style.display = "none"; }
  window.addEventListener('click', function(event) { // Usar addEventListener para no sobreescribir otros
    if (event.target == modalEditarPresupuesto) modalEditarPresupuesto.style.display = "none";
    if (event.target == modalWhatsAppLinks) modalWhatsAppLinks.style.display = "none";
  });

  async function abrirModalEditarPresupuesto(presupuestoId, dataPresupuesto) {
      if (!presupuestoIdEditarInput || !vehiculoSelectEditar || !tablaBodyEditar || !inputManoObraDescripcionEditar || !inputManoObraMontoEditar || !totalSpanEditar || !modalEditarPresupuesto) return;
      if (!dataPresupuesto) {
          const doc = await db.collection('presupuestos').doc(presupuestoId).get();
          if (!doc.exists) { alert('Presupuesto no encontrado.'); return; }
          dataPresupuesto = doc.data();
      }
      presupuestoIdEditarInput.value = presupuestoId;
      await cargarVehiculosParaPresupuesto(vehiculoSelectEditar, dataPresupuesto.vehiculoDocId); // Cargar y seleccionar
      
      tablaBodyEditar.innerHTML = '';
      if(dataPresupuesto.items && dataPresupuesto.items.length > 0){
          dataPresupuesto.items.forEach(item => {
              agregarItemPresupuesto(tablaBodyEditar, true);
              const ultimaFila = tablaBodyEditar.lastElementChild;
              if(ultimaFila && ultimaFila.cells.length >=3) {
                ultimaFila.querySelector('.item-repuesto').value = item.repuesto;
                ultimaFila.querySelector('.item-monto').value = item.monto.toFixed(2);
                ultimaFila.querySelector('.item-link').value = item.link || '';
              }
          });
      }
      inputManoObraDescripcionEditar.value = dataPresupuesto.manoDeObra ? dataPresupuesto.manoDeObra.descripcion : '';
      inputManoObraMontoEditar.value = dataPresupuesto.manoDeObra ? dataPresupuesto.manoDeObra.monto.toFixed(2) : '0.00';
      actualizarTotalPresupuesto(true); // Actualizar total después de poblar
      modalEditarPresupuesto.style.display = "block";
  }

  if(btnAgregarItemEditar) btnAgregarItemEditar.onclick = () => agregarItemPresupuesto(tablaBodyEditar, true);
  if(tablaBodyEditar) {
      tablaBodyEditar.addEventListener('click', e => {
        if (e.target.classList.contains('borrar-item')) {
          e.target.closest('tr').remove();
          actualizarTotalPresupuesto(true);
        }
      });
  }
  if(inputManoObraMontoEditar) inputManoObraMontoEditar.addEventListener('input', () => actualizarTotalPresupuesto(true));
  if(inputManoObraDescripcionEditar) inputManoObraDescripcionEditar.addEventListener('input', () => {/* No afecta el total directamente, pero bueno tenerlo */});

  if(vehiculoSelectEditar && infoClientePresupuestoEditarP) {
      vehiculoSelectEditar.addEventListener('change', function() {
            const selectedVehiculoId = this.value;
            infoClientePresupuestoEditarP.textContent = '';
            if (selectedVehiculoId && vehiculosCargadosParaPresupuesto) {
                const vehiculoSeleccionado = vehiculosCargadosParaPresupuesto.find(v => v.id === selectedVehiculoId);
                if (vehiculoSeleccionado) {
                    infoClientePresupuestoEditarP.textContent = `Cliente: ${vehiculoSeleccionado.clienteNombre || 'N/A'} - Tel: ${vehiculoSeleccionado.clienteTelefono || 'N/A'}`;
                }
            }
      });
  }

  if(formEditarPresupuesto) {
      formEditarPresupuesto.addEventListener('submit', async (e) => {
          e.preventDefault();
          const id = presupuestoIdEditarInput.value;
          if (!id) { alert("Error: ID de presupuesto no encontrado."); return; }
          const submitButton = formEditarPresupuesto.querySelector('button[type="submit"]');
          submitButton.disabled = true; submitButton.textContent = 'Guardando...';

          const vehiculoIdFirestore = vehiculoSelectEditar.value;
          const vehiculoSeleccionado = vehiculosCargadosParaPresupuesto.find(v => v.id === vehiculoIdFirestore);
          if (!vehiculoSeleccionado) { alert("Vehículo no válido."); submitButton.disabled = false; submitButton.textContent = 'Guardar Cambios'; return; }

          const itemsEditados = [];
          tablaBodyEditar.querySelectorAll('tr').forEach(row => {
            const repuestoInput = row.querySelector('.item-repuesto');
            const montoInput = row.querySelector('.item-monto');
            const linkInput = row.querySelector('.item-link');
            if(repuestoInput && montoInput && linkInput){
                const repuesto = repuestoInput.value.trim();
                const monto = parseFloat(montoInput.value) || 0;
                const link = linkInput.value.trim();
                if (repuesto) itemsEditados.push({ repuesto, monto: parseFloat(monto.toFixed(2)), link });
            }
          });
          const manoObraDescEditada = inputManoObraDescripcionEditar.value.trim();
          const manoObraMontoEditado = parseFloat(inputManoObraMontoEditar.value) || 0;
          if (itemsEditados.length === 0 && manoObraMontoEditado <= 0 && !manoObraDescEditada) {
             alert("El presupuesto editado debe tener al menos un item o detalle de mano de obra.");
             submitButton.disabled = false; submitButton.textContent = 'Guardar Cambios del Presupuesto'; return;
          }
          const presupuestoActualizado = {
              vehiculoDocId: vehiculoIdFirestore,
              vehiculoInfo: `${vehiculoSeleccionado.patente || ''} ${vehiculoSeleccionado.marca || ''} ${vehiculoSeleccionado.modelo || ''}`.trim().replace(/\s+/g, ' '),
              clienteNombre: vehiculoSeleccionado.clienteNombre || '',
              clienteTelefono: vehiculoSeleccionado.clienteTelefono || '',
              items: itemsEditados,
              manoDeObra: { descripcion: manoObraDescEditada, monto: parseFloat(manoObraMontoEditado.toFixed(2)) },
              total: parseFloat(totalSpanEditar.textContent),
              actualizadoEl: firebase.firestore.FieldValue.serverTimestamp()
          };
          try {
              await db.collection("presupuestos").doc(id).update(presupuestoActualizado);
              alert("¡Presupuesto actualizado con éxito!");
              modalEditarPresupuesto.style.display = "none";
          } catch (error) {
              console.error("Error al actualizar presupuesto:", error);
              alert("Error al actualizar: " + error.message);
          } finally {
              submitButton.disabled = false; submitButton.textContent = 'Guardar Cambios del Presupuesto';
          }
      });
  }

  if(btnCerrarModalWhatsAppLinks) btnCerrarModalWhatsAppLinks.onclick = () => { modalWhatsAppLinks.style.display = "none"; }
  function prepararWhatsAppModal(dataPresupuesto, presupuestoId) {
      whatsappLinksListDiv.innerHTML = '';
      let hasLinks = false;
      if (dataPresupuesto.items && dataPresupuesto.items.length > 0) {
          dataPresupuesto.items.forEach((item, index) => {
              if (item.link) {
                  hasLinks = true;
                  const div = document.createElement('div'); div.classList.add('link-item');
                  const checkbox = document.createElement('input');
                  checkbox.type = 'checkbox'; checkbox.id = `link-whatsapp-${index}`;
                  checkbox.value = item.link; checkbox.dataset.descripcion = item.repuesto;
                  checkbox.checked = true;
                  const label = document.createElement('label');
                  label.htmlFor = `link-whatsapp-${index}`; label.textContent = `${item.repuesto}: ${item.link}`;
                  div.appendChild(checkbox); div.appendChild(label);
                  whatsappLinksListDiv.appendChild(div);
              }
          });
      }
      if (!hasLinks) {
          whatsappLinksListDiv.innerHTML = "<p>Este presupuesto no tiene ítems con links para compartir.</p>";
          btnEnviarWhatsAppSeleccionados.style.display = 'none';
      } else {
          btnEnviarWhatsAppSeleccionados.style.display = 'block';
      }
      whatsappPresupuestoIdDataInput.value = JSON.stringify({ ...dataPresupuesto, presupuestoId }); // Guardar todo el objeto
      modalWhatsAppLinks.style.display = 'block';
  }

  if(btnEnviarWhatsAppSeleccionados) {
      btnEnviarWhatsAppSeleccionados.addEventListener('click', () => {
          const dataPresupuestoCompleto = JSON.parse(whatsappPresupuestoIdDataInput.value);
          const linksSeleccionados = [];
          whatsappLinksListDiv.querySelectorAll('input[type="checkbox"]:checked').forEach(cb => {
              linksSeleccionados.push({ descripcion: cb.dataset.descripcion, url: cb.value });
          });
          enviarWhatsAppPresupuesto(dataPresupuestoCompleto, dataPresupuestoCompleto.presupuestoId, linksSeleccionados);
          modalWhatsAppLinks.style.display = 'none';
      });
  }

  if (vehiculoSelect && infoClientePresupuestoP) {
      vehiculoSelect.addEventListener('change', function() {
            const selectedVehiculoId = this.value;
            infoClientePresupuestoP.textContent = '';
            if (selectedVehiculoId && vehiculosCargadosParaPresupuesto) {
                const vehiculoSeleccionado = vehiculosCargadosParaPresupuesto.find(v => v.id === selectedVehiculoId);
                if (vehiculoSeleccionado) {
                    infoClientePresupuestoP.textContent = `Cliente: ${vehiculoSeleccionado.clienteNombre || 'No especificado'} - Tel: ${vehiculoSeleccionado.clienteTelefono || 'N/A'}`;
                }
            }
      });
  }
  if (btnAgregarItem && tablaBody) {
    btnAgregarItem.addEventListener('click', () => agregarItemPresupuesto(tablaBody, false));
  }
  if (tablaBody) {
    tablaBody.addEventListener('click', e => {
      if (e.target.classList.contains('borrar-item')) {
        e.target.closest('tr').remove();
        actualizarTotalPresupuesto(false);
      }
    });
  }
  if (inputManoObraMonto) { inputManoObraMonto.addEventListener('input', () => actualizarTotalPresupuesto(false)); }

  if (btnGuardarPresupuesto) {
    btnGuardarPresupuesto.addEventListener('click', async () => {
      if (!vehiculoSelect || !tablaBody || !totalSpan || !inputManoObraDescripcion || !inputManoObraMonto || !db) return;
      const vehiculoIdFirestore = vehiculoSelect.value;
      if (!vehiculosCargadosParaPresupuesto || vehiculosCargadosParaPresupuesto.length === 0) {
          await cargarVehiculosParaPresupuesto();
          if (!vehiculosCargadosParaPresupuesto || vehiculosCargadosParaPresupuesto.length === 0) {
              alert("No se pudieron cargar datos de vehículos. Refresca la página e inténtalo de nuevo."); return;
          }
      }
      const vehiculoSeleccionado = vehiculosCargadosParaPresupuesto.find(v => v.id === vehiculoIdFirestore);
      if (!vehiculoIdFirestore || !vehiculoSeleccionado) {
          alert("Selecciona un vehículo válido."); return;
      }
      const vehiculoInfoTexto = `${vehiculoSeleccionado.patente || ''} ${vehiculoSeleccionado.marca || ''} ${vehiculoSeleccionado.modelo || ''}`.trim().replace(/\s+/g, ' ');
      const items = [];
      tablaBody.querySelectorAll('tr').forEach((row) => {
        const repuestoInput = row.querySelector('.item-repuesto');
        const montoInput = row.querySelector('.item-monto');
        const linkInput = row.querySelector('.item-link');
        if(repuestoInput && montoInput && linkInput){
            const repuesto = repuestoInput.value.trim();
            const monto = parseFloat(montoInput.value) || 0;
            const link = linkInput.value.trim();
            if (repuesto) items.push({ repuesto, monto: parseFloat(monto.toFixed(2)), link });
        }
      });
      const manoObraDesc = inputManoObraDescripcion.value.trim();
      const manoObraMontoVal = parseFloat(inputManoObraMonto.value) || 0;
      if (items.length === 0 && manoObraMontoVal <= 0 && !manoObraDesc) {
           alert("Agrega items o detalle de mano de obra."); return;
      }
      const presupuesto = {
        vehiculoDocId: vehiculoIdFirestore, vehiculoInfo: vehiculoInfoTexto,
        clienteNombre: vehiculoSeleccionado.clienteNombre || '', clienteTelefono: vehiculoSeleccionado.clienteTelefono || '',
        items, manoDeObra: { descripcion: manoObraDesc, monto: parseFloat(manoObraMontoVal.toFixed(2)) },
        total: parseFloat(totalSpan.textContent),
        creadoEl: firebase.firestore.FieldValue.serverTimestamp(), estado: "Pendiente"
      };
      const submitButton = btnGuardarPresupuesto;
      submitButton.disabled = true; submitButton.textContent = 'Guardando...';
      try {
        const docRef = await db.collection("presupuestos").add(presupuesto);
        alert(`¡Presupuesto guardado! ID: ${docRef.id}`);
        if (tablaBody) tablaBody.innerHTML = "";
        totalSpan.textContent = "0.00"; vehiculoSelect.value = "";
        if (inputManoObraDescripcion) inputManoObraDescripcion.value = "";
        if (inputManoObraMonto) inputManoObraMonto.value = "";
        if (infoClientePresupuestoP) infoClientePresupuestoP.textContent = "";
        actualizarTotalPresupuesto(false); // Para resetear el total a 0.00
      } catch (e) {
        alert("Error al guardar presupuesto: " + e.message);
      } finally {
        submitButton.disabled = false; submitButton.textContent = 'Guardar Nuevo Presupuesto';
      }
    });
  }
  cargarVehiculosParaPresupuesto();
  mostrarPresupuestosGuardados();
});