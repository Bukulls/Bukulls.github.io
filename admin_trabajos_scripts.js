document.addEventListener('DOMContentLoaded', function() {
  if (typeof db === 'undefined' || typeof storage === 'undefined') {
    console.error("Firebase (db y storage) no están inicializados.");
    alert("Error crítico: No se pudo conectar a los servicios de Firebase.");
    return;
  }

  const listaTrabajosDiv = document.getElementById('lista-trabajos');
  const filtroEstadoTrabajoSelect = document.getElementById('filtro-estado-trabajo');

  // --- Modal de Edición de Novedad ---
  const modalEditarNovedad = document.getElementById('modal-editar-novedad');
  const btnCerrarModalEditarNovedad = document.getElementById('cerrar-modal-editar-novedad');
  const formEditarNovedad = document.getElementById('form-editar-novedad');
  const inputTrabajoIdEditarNovedad = document.getElementById('editar-novedad-trabajo-id');
  const inputNovedadIndexEditarNovedad = document.getElementById('editar-novedad-index');
  const textareaDescripcionNovedadEditar = document.getElementById('descripcion-novedad-editar');

  if (btnCerrarModalEditarNovedad) {
    btnCerrarModalEditarNovedad.onclick = function() {
      if (modalEditarNovedad) modalEditarNovedad.style.display = "none";
    }
  }
  window.addEventListener('click', function(event) { // Usar window para cerrar cualquier modal abierto
    if (event.target == modalEditarNovedad) {
      if (modalEditarNovedad) modalEditarNovedad.style.display = "none";
    }
  });


  async function mostrarTrabajos(filtroEstado = "todos") {
      if (!listaTrabajosDiv) return;
      listaTrabajosDiv.innerHTML = '<p>Cargando trabajos...</p>';

      let query = db.collection("trabajos_en_curso");
      if (filtroEstado !== "todos") {
          query = query.where("estadoTrabajo", "==", filtroEstado);
      }
      query = query.orderBy("fechaInicioTrabajo", "desc");

      query.onSnapshot(snapshot => {
          if (snapshot.empty) {
              listaTrabajosDiv.innerHTML = `<p>No hay trabajos ${filtroEstado !== "todos" ? `con estado '${filtroEstado}'` : ''} registrados.</p>`;
              return;
          }
          let trabajosHTML = "";
          snapshot.forEach(doc => {
              const t = doc.data();
              const id = doc.id;

              let manoDeObraTrabajoHTML = '';
              if (t.manoDeObra && t.manoDeObra.monto > 0) {
                  manoDeObraTrabajoHTML = `<li style="color: #ffc107;">Mano de Obra (${t.manoDeObra.descripcion || 'General'}): $${t.manoDeObra.monto.toFixed(2)}</li>`;
              }

              let claseEstado = `estado-${(t.estadoTrabajo || 'pendiente').toLowerCase().replace(/\s+/g, '-')}`;

              let novedadesHTML = '<div class="novedades-lista"><h6>Novedades del Trabajo:</h6>';
              if (t.novedades && t.novedades.length > 0) {
                  // Iterar en orden original para que los índices coincidan con Firestore
                  t.novedades.forEach((nov, index) => {
                      let fechaNovedadStr = 'N/A';
                      if (nov.fecha) {
                          if (typeof nov.fecha.toDate === 'function') {
                              fechaNovedadStr = nov.fecha.toDate().toLocaleString();
                          } else if (nov.fecha instanceof Date) {
                              fechaNovedadStr = nov.fecha.toLocaleString();
                          } else {
                             try { fechaNovedadStr = new Date(nov.fecha).toLocaleString(); } catch(e){}
                          }
                      }
                      novedadesHTML += `
                          <div class="novedad-item">
                              <p><strong>Descripción:</strong> <span id="novedad-desc-${id}-${index}">${nov.descripcion || 'N/A'}</span></p>
                              ${nov.imageUrl ? `<img src="${nov.imageUrl}" alt="Imagen novedad ${nov.descripcion || ''}">` : ''}
                              <p style="font-size:0.8em; color:#888;">Fecha: ${fechaNovedadStr}</p>
                              <div class="novedad-actions">
                                <button class="btn-action btn-edit-novedad" data-trabajo-id="${id}" data-novedad-index="${index}" data-descripcion="${nov.descripcion || ''}">Editar</button>
                                <button class="btn-action btn-delete-novedad" data-trabajo-id="${id}" data-novedad-index="${index}" data-image-url="${nov.imageUrl || ''}">Eliminar</button>
                              </div>
                          </div>`;
                  });
              } else {
                  novedadesHTML += '<p>No hay novedades registradas para este trabajo.</p>';
              }
              novedadesHTML += '</div>';

              let formNovedadHTML = '';
              if (t.estadoTrabajo === 'En Proceso') {
                  formNovedadHTML = `
                    <div class="novedad-form-container" style="margin-top:15px;">
                        <h6 style="color:#17a2b8; margin-top:0;">Agregar Novedad al Trabajo</h6>
                        <form class="form-agregar-novedad" data-trabajo-id="${id}">
                            <label for="novedad-descripcion-${id}">Descripción de la Novedad:</label>
                            <textarea id="novedad-descripcion-${id}" rows="2"></textarea>
                            <label for="novedad-imagen-${id}">Imagen (Opcional):</label>
                            <input type="file" id="novedad-imagen-${id}" accept="image/*">
                            <div class="progress-bar-container" id="novedad-progress-container-${id}">
                                <div class="progress-bar" id="novedad-progress-bar-${id}"></div>
                            </div>
                            <button type="submit" class="btn-action" style="background-color:#17a2b8;">Agregar Novedad</button>
                        </form>
                    </div>`;
              }

              trabajosHTML += `
                  <div class="trabajo-item ${claseEstado}">
                      <h5>Trabajo: ${t.vehiculoInfo || 'N/A'} (ID: ${id.substring(0,8)})</h5>
                      <p><strong>Cliente:</strong> ${t.clienteNombre || 'N/A'} ${t.clienteTelefono ? `- Tel: ${t.clienteTelefono}`: ''}</p>
                      <p><strong>Monto Total Presupuestado:</strong> <span style="font-weight:bold; color: #4CAF50;">$${t.total ? t.total.toFixed(2) : '0.00'}</span></p>
                      <p><strong>Estado Actual:</strong> <span style="font-weight:bold;">${t.estadoTrabajo || 'Pendiente'}</span></p>
                      <p><strong>ID Presupuesto Original:</strong> ${t.presupuestoOriginalId || 'N/A'}</p>
                      <p><strong>Items del Presupuesto:</strong></p>
                      <ul style="padding-left: 20px; margin-bottom: 10px;">
                          ${t.items && t.items.length > 0 ? t.items.map(item => `<li>${item.repuesto}: $${item.monto ? item.monto.toFixed(2) : '0.00'}</li>`).join('') : '<li>No hay items detallados.</li>'}
                          ${manoDeObraTrabajoHTML}
                      </ul>
                      <p style="font-size: 0.8em; color: #888;">Presup. Aceptado: ${t.fechaAceptacionPresupuesto ? new Date(t.fechaAceptacionPresupuesto.seconds * 1000).toLocaleDateString() : 'N/A'}</p>
                      <p style="font-size: 0.8em; color: #888;">Trabajo Iniciado: ${t.fechaInicioTrabajo ? new Date(t.fechaInicioTrabajo.seconds * 1000).toLocaleDateString() : 'N/A'}</p>
                      ${t.fechaCompletado ? `<p style="font-size: 0.8em; color: #28a745;">Completado el: ${new Date(t.fechaCompletado.seconds * 1000).toLocaleString()}</p>` : ''}
                      ${t.fechaCancelado ? `<p style="font-size: 0.8em; color: #dc3545;">Cancelado el: ${new Date(t.fechaCancelado.seconds * 1000).toLocaleString()}</p>` : ''}

                      ${novedadesHTML}
                      ${formNovedadHTML}

                      <div style="margin-top: 15px; border-top:1px solid #444; padding-top:10px;">
                          <label for="estado-trabajo-${id}" style="display:inline-block; margin-right:5px;">Cambiar Estado del Trabajo:</label>
                          <select id="estado-trabajo-${id}" data-trabajo-id="${id}" class="cambiar-estado-trabajo-select">
                              <option value="Pendiente" ${t.estadoTrabajo === 'Pendiente' ? 'selected' : ''}>Pendiente</option>
                              <option value="En Proceso" ${t.estadoTrabajo === 'En Proceso' ? 'selected' : ''}>En Proceso</option>
                              <option value="Completado" ${t.estadoTrabajo === 'Completado' ? 'selected' : ''}>Completado</option>
                              <option value="Cancelado" ${t.estadoTrabajo === 'Cancelado' ? 'selected' : ''}>Cancelado</option>
                          </select>
                          <button class="btn-action confirmar-cambio-estado" data-trabajo-id="${id}" style="background-color:#007bff; margin-left:10px;">Confirmar Cambio de Estado</button>
                      </div>
                  </div>`;
          });
          listaTrabajosDiv.innerHTML = trabajosHTML;

          // --- Event Listeners Dinámicos (delegación podría ser mejor si hay muchos items) ---
          listaTrabajosDiv.querySelectorAll('.form-agregar-novedad').forEach(form => {
              form.addEventListener('submit', async (e) => {
                  e.preventDefault();
                  const trabajoId = e.target.dataset.trabajoId;
                  const descripcionInput = document.getElementById(`novedad-descripcion-${trabajoId}`);
                  const imagenInput = document.getElementById(`novedad-imagen-${trabajoId}`);
                  const descripcionNovedad = descripcionInput ? descripcionInput.value.trim() : "";
                  const imagenFile = imagenInput && imagenInput.files.length > 0 ? imagenInput.files[0] : null;
                  if (!descripcionNovedad && !imagenFile) {
                      alert("Debes añadir una descripción o una imagen para la novedad."); return;
                  }
                  await agregarNovedadAlTrabajo(trabajoId, imagenFile, descripcionNovedad, e.target);
              });
          });

          listaTrabajosDiv.querySelectorAll('.confirmar-cambio-estado').forEach(button => {
              button.addEventListener('click', async (e) => {
                  const trabajoId = e.target.dataset.trabajoId;
                  const selectEstado = document.getElementById(`estado-trabajo-${trabajoId}`);
                  await actualizarEstadoTrabajo(trabajoId, selectEstado.value);
              });
          });

          listaTrabajosDiv.querySelectorAll('.cambiar-estado-trabajo-select').forEach(select => {
              select.addEventListener('focus', function () { this.previousValue = this.value; });
              select.addEventListener('change', async (e) => {
                  const trabajoId = e.target.dataset.trabajoId;
                  const nuevoEstado = e.target.value;
                  if (nuevoEstado !== "Completado" && nuevoEstado !== "Cancelado") { // Actualizar directo si no es estado final
                     await actualizarEstadoTrabajo(trabajoId, nuevoEstado);
                  }
                  // Para estados finales, se espera confirmación del botón.
              });
          });

          listaTrabajosDiv.querySelectorAll('.btn-edit-novedad').forEach(btn => {
              btn.addEventListener('click', (e) => {
                  const trabajoId = e.target.dataset.trabajoId;
                  const novedadIndex = parseInt(e.target.dataset.novedadIndex);
                  const descripcionActual = e.target.dataset.descripcion;
                  abrirModalEditarNovedad(trabajoId, novedadIndex, descripcionActual);
              });
          });

          listaTrabajosDiv.querySelectorAll('.btn-delete-novedad').forEach(btn => {
              btn.addEventListener('click', async (e) => {
                  const trabajoId = e.target.dataset.trabajoId;
                  const novedadIndex = parseInt(e.target.dataset.novedadIndex);
                  const imageUrl = e.target.dataset.imageUrl;
                  await eliminarNovedadDeTrabajo(trabajoId, novedadIndex, imageUrl);
              });
          });

      }, error => {
          console.error("Error onSnapshot trabajos:", error);
          if (listaTrabajosDiv) listaTrabajosDiv.innerHTML = '<p style="color:red;">Error al cargar trabajos.</p>';
      });
  }

  async function agregarNovedadAlTrabajo(trabajoId, imagenFile, descripcionNovedad, formElement) {
      const submitButton = formElement.querySelector('button[type="submit"]');
      const progressContainer = document.getElementById(`novedad-progress-container-${trabajoId}`);
      const progressBar = document.getElementById(`novedad-progress-bar-${trabajoId}`);

      submitButton.disabled = true;
      submitButton.textContent = 'Agregando...';
      let imageUrl = null;

      try {
          if (imagenFile) {
              if (progressContainer) progressContainer.style.display = 'block';
              if (progressBar) { progressBar.style.width = '0%'; progressBar.textContent = '0%';}
              const imageName = `${Date.now()}_${imagenFile.name.replace(/\s+/g, '_')}`;
              const storagePath = `trabajos_novedades/${trabajoId}/${imageName}`;
              const imageRef = storage.ref().child(storagePath);
              const uploadTask = imageRef.put(imagenFile);

              await new Promise((resolve, reject) => {
                  uploadTask.on('state_changed',
                      (snapshot) => {
                          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                          if (progressBar) { progressBar.style.width = progress + '%'; progressBar.textContent = Math.round(progress) + '%';}
                      },
                      (error) => reject(error),
                      async () => {
                          try {
                              imageUrl = await uploadTask.snapshot.ref.getDownloadURL();
                              resolve();
                          } catch (getUrlError){ reject(getUrlError); }
                      }
                  );
              });
          }

          const nuevaNovedad = {
              descripcion: descripcionNovedad || (imageUrl ? "Imagen adjunta" : "Actualización sin descripción"),
              imageUrl: imageUrl,
              fecha: new Date() // Usar objeto Date de JS, Firestore lo convertirá a Timestamp
          };

          const trabajoRef = db.collection("trabajos_en_curso").doc(trabajoId);
          await trabajoRef.update({
              novedades: firebase.firestore.FieldValue.arrayUnion(nuevaNovedad)
          });

          alert("Novedad agregada con éxito.");
          formElement.reset();
          if (progressContainer) progressContainer.style.display = 'none';
          if (progressBar) progressBar.textContent = ''; // Limpiar texto de progreso
      } catch (error) {
          console.error("Error al agregar novedad:", error);
          alert("Error al agregar la novedad: " + error.message);
      } finally {
          submitButton.disabled = false;
          submitButton.textContent = 'Agregar Novedad';
      }
  }

  async function actualizarEstadoTrabajo(trabajoId, nuevoEstado) {
      if (!trabajoId || !nuevoEstado) { alert("Faltan datos para actualizar."); return; }
      console.log(`Actualizando trabajo ${trabajoId} a estado: ${nuevoEstado}`);
      try {
          const trabajoRef = db.collection("trabajos_en_curso").doc(trabajoId);
          let datosActualizar = { estadoTrabajo: nuevoEstado };
          if (nuevoEstado === 'Completado') {
            datosActualizar.fechaCompletado = firebase.firestore.FieldValue.serverTimestamp();
            datosActualizar.fechaCancelado = firebase.firestore.FieldValue.delete(); // Asegurar que no haya fecha de cancelación
          } else if (nuevoEstado === 'Cancelado') {
            datosActualizar.fechaCancelado = firebase.firestore.FieldValue.serverTimestamp();
            datosActualizar.fechaCompletado = firebase.firestore.FieldValue.delete(); // Asegurar que no haya fecha de completado
          } else { // Pendiente o En Proceso
            datosActualizar.fechaCompletado = firebase.firestore.FieldValue.delete();
            datosActualizar.fechaCancelado = firebase.firestore.FieldValue.delete();
          }
          await trabajoRef.update(datosActualizar);
          // onSnapshot refrescará la UI
      } catch (error) {
          console.error("Error al actualizar estado del trabajo:", error);
          alert("Error al actualizar el estado: " + error.message);
      }
  }

  function abrirModalEditarNovedad(trabajoId, novedadIndex, descripcionActual) {
      if (!modalEditarNovedad || !inputTrabajoIdEditarNovedad || !inputNovedadIndexEditarNovedad || !textareaDescripcionNovedadEditar) {
          console.error("Elementos del modal de edición de novedad no encontrados.");
          return;
      }
      inputTrabajoIdEditarNovedad.value = trabajoId;
      inputNovedadIndexEditarNovedad.value = novedadIndex;
      textareaDescripcionNovedadEditar.value = descripcionActual;
      modalEditarNovedad.style.display = "block";
  }

  if (formEditarNovedad) {
    formEditarNovedad.addEventListener('submit', async (e) => {
        e.preventDefault();
        const trabajoId = inputTrabajoIdEditarNovedad.value;
        const novedadIndex = parseInt(inputNovedadIndexEditarNovedad.value);
        const nuevaDescripcion = textareaDescripcionNovedadEditar.value.trim();

        if (!trabajoId || isNaN(novedadIndex) || !nuevaDescripcion) {
            alert("Faltan datos o la descripción está vacía.");
            return;
        }

        const submitButton = formEditarNovedad.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        submitButton.textContent = 'Guardando...';

        try {
            const trabajoRef = db.collection("trabajos_en_curso").doc(trabajoId);
            const doc = await trabajoRef.get();
            if (!doc.exists) {
                alert("El trabajo ya no existe."); throw new Error("Trabajo no encontrado");
            }

            let novedades = doc.data().novedades || [];
            if (novedadIndex >= 0 && novedadIndex < novedades.length) {
                // Crear un nuevo objeto para la novedad actualizada para asegurar que se detecte el cambio
                const novedadActualizada = {
                    ...novedades[novedadIndex], // Copiar propiedades existentes (fecha, imageUrl)
                    descripcion: nuevaDescripcion
                };
                novedades[novedadIndex] = novedadActualizada;

                await trabajoRef.update({ novedades: novedades });
                alert("Descripción de la novedad actualizada.");
                if (modalEditarNovedad) modalEditarNovedad.style.display = "none";
                // onSnapshot debería refrescar la UI, pero si no, aquí se podría actualizar el span directamente
                // document.getElementById(`novedad-desc-${trabajoId}-${novedadIndex}`).textContent = nuevaDescripcion;
            } else {
                alert("Índice de novedad inválido.");
            }
        } catch (error) {
            console.error("Error al actualizar descripción de novedad:", error);
            alert("Error al actualizar: " + error.message);
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = 'Guardar Cambios';
        }
    });
  }

  async function eliminarNovedadDeTrabajo(trabajoId, novedadIndex, imageUrl) {
      if (!confirm("¿Estás seguro de eliminar esta novedad?")) return;

      try {
          const trabajoRef = db.collection("trabajos_en_curso").doc(trabajoId);
          const doc = await trabajoRef.get();
          if (!doc.exists) {
              alert("El trabajo ya no existe."); throw new Error("Trabajo no encontrado");
          }

          let novedades = doc.data().novedades || [];
          if (novedadIndex >= 0 && novedadIndex < novedades.length) {
              const novedadAEliminar = novedades[novedadIndex]; // Guardamos la novedad antes de quitarla del array
              novedades.splice(novedadIndex, 1); // Eliminar la novedad del array

              // Si la novedad tiene una imagen, eliminarla de Storage
              if (novedadAEliminar.imageUrl) { // Usamos la imageUrl del objeto que obtuvimos
                  try {
                      const imageRef = storage.refFromURL(novedadAEliminar.imageUrl);
                      await imageRef.delete();
                      console.log("Imagen de novedad eliminada de Storage:", novedadAEliminar.imageUrl);
                  } catch (storageError) {
                      console.warn("Error al eliminar imagen de Storage (puede que ya no exista):", storageError.message);
                      // Continuar incluso si la imagen no se pudo borrar de Storage
                  }
              }

              await trabajoRef.update({ novedades: novedades });
              alert("Novedad eliminada.");
              // onSnapshot se encargará de refrescar la UI.
          } else {
              alert("Índice de novedad inválido.");
          }
      } catch (error) {
          console.error("Error al eliminar novedad:", error);
          alert("Error al eliminar la novedad: " + error.message);
      }
  }

  // Carga inicial y filtro
  if (filtroEstadoTrabajoSelect) {
      filtroEstadoTrabajoSelect.addEventListener('change', (e) => {
          mostrarTrabajos(e.target.value);
      });
  }

  if (typeof mostrarTrabajos === "function") {
    mostrarTrabajos();
  } else {
      console.error("Función mostrarTrabajos no está definida al inicio.");
  }
});