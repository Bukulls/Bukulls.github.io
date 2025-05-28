document.addEventListener('DOMContentLoaded', function() {
  // --- Lógica para el Menú Hamburguesa ---
  const adminMenuToggle = document.getElementById('adminMenuToggle');
  const adminMenu = document.getElementById('adminMenu'); // El <aside>

  if (adminMenuToggle && adminMenu) {
    adminMenuToggle.addEventListener('click', function() {
      adminMenu.classList.toggle('admin-menu-open');
      const isExpanded = adminMenu.classList.contains('admin-menu-open');
      this.setAttribute('aria-expanded', isExpanded);
      if (isExpanded) {
        this.innerHTML = '&times;'; // Cambiar a ícono de "X" (cerrar)
        this.setAttribute('aria-label', 'Cerrar menú');
      } else {
        this.innerHTML = '&#9776;'; // Cambiar de nuevo a hamburguesa
        this.setAttribute('aria-label', 'Abrir menú');
      }
    });
  }

  // --- Resto de tu código existente de admin_trabajos_scripts.js ---
  if (typeof db === 'undefined' || typeof storage === 'undefined') {
    console.error("Firebase (db y storage) no están inicializados.");
    alert("Error crítico: No se pudo conectar a los servicios de Firebase.");
    return;
  }

  const listaTrabajosDiv = document.getElementById('lista-trabajos');
  const filtroEstadoTrabajoSelect = document.getElementById('filtro-estado-trabajo');

  const modalEditarNovedad = document.getElementById('modal-editar-novedad');
  const btnCerrarModalEditarNovedad = document.getElementById('cerrar-modal-editar-novedad');
  const formEditarNovedad = document.getElementById('form-editar-novedad');
  const inputTrabajoIdEditarNovedad = document.getElementById('editar-novedad-trabajo-id');
  const inputNovedadIndexEditarNovedad = document.getElementById('editar-novedad-index');
  const textareaDescripcionNovedadEditar = document.getElementById('descripcion-novedad-editar');

  const modalVerImagenNovedad = document.getElementById('modal-ver-imagen-novedad');
  const btnCerrarModalVerImagen = document.getElementById('cerrar-modal-ver-imagen');
  const imgVisualizadorNovedad = document.getElementById('imagen-novedad-visualizador');


  if (btnCerrarModalEditarNovedad) {
    btnCerrarModalEditarNovedad.onclick = () => { if(modalEditarNovedad) modalEditarNovedad.style.display = "none"; }
  }
  if (btnCerrarModalVerImagen) {
    btnCerrarModalVerImagen.onclick = () => { if(modalVerImagenNovedad) modalVerImagenNovedad.style.display = "none"; }
  }

  window.addEventListener('click', function(event) {
    if (event.target == modalEditarNovedad) {
      modalEditarNovedad.style.display = "none";
    }
    if (event.target == modalVerImagenNovedad) {
      modalVerImagenNovedad.style.display = "none";
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
              const estadoTrabajoLower = (t.estadoTrabajo || 'pendiente').toLowerCase().replace(/\s+/g, '-');
              const claseEstado = `estado-${estadoTrabajoLower}`;

              let novedadesHTML = '<div class="novedades-lista"><h6>Novedades del Trabajo:</h6>';
              if (t.novedades && t.novedades.length > 0) {
                  t.novedades.forEach((nov, index) => {
                      let fechaNovedadStr = 'N/A';
                      if (nov.fecha && typeof nov.fecha.toDate === 'function') {
                          fechaNovedadStr = nov.fecha.toDate().toLocaleString();
                      } else if (nov.fecha) {
                          try { fechaNovedadStr = new Date(nov.fecha).toLocaleString(); } catch(e){}
                      }

                      let imagenTag = '';
                      if (nov.imageUrl) {
                          imagenTag = `<button class="btn-action btn-ver-imagen-novedad" data-image-url="${nov.imageUrl}">Ver Imagen</button>`;
                      }

                      novedadesHTML += `
                          <div class="novedad-item">
                              <p><strong>Descripción:</strong> <span id="novedad-desc-${id}-${index}">${nov.descripcion || 'N/A'}</span></p>
                              ${imagenTag}
                              <p style="font-size:0.8em; color:#888;">Fecha: ${fechaNovedadStr}</p>
                              <div class="novedad-actions">
                                <button class="btn-action btn-edit-novedad" data-trabajo-id="${id}" data-novedad-index="${index}" data-descripcion="${nov.descripcion || ''}">Editar Desc.</button>
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
                            <label for="novedad-descripcion-form-${id}">Descripción de la Novedad:</label> <textarea id="novedad-descripcion-form-${id}" rows="2"></textarea>
                            <label for="novedad-imagen-${id}">Imagen (Opcional):</label>
                            <input type="file" id="novedad-imagen-${id}" accept="image/*">
                            <div class="progress-bar-container" id="novedad-progress-container-${id}">
                                <div class="progress-bar" id="novedad-progress-bar-${id}"></div>
                            </div>
                            <button type="submit" class="btn-action" style="background-color:#17a2b8;">Agregar Novedad</button>
                        </form>
                    </div>`;
              }

              let manoDeObraTrabajoHTML = '';
              if (t.manoDeObra && t.manoDeObra.monto > 0) {
                  manoDeObraTrabajoHTML = `<li style="color: #ffc107;">Mano de Obra (${t.manoDeObra.descripcion || 'General'}): $${t.manoDeObra.monto.toFixed(2)}</li>`;
              }

              trabajosHTML += `
                  <div class="trabajo-item ${claseEstado}" id="trabajo-${id}">
                      <div class="trabajo-header" data-trabajo-id="${id}">
                          <h5>${t.vehiculoInfo || 'Vehículo N/A'} (Cliente: ${t.clienteNombre || 'N/A'})</h5>
                          <span class="trabajo-estado-label">${t.estadoTrabajo || 'Pendiente'}</span>
                      </div>
                      <div class="trabajo-content">
                          <p><strong>ID del Trabajo:</strong> ${id.substring(0,8)}</p>
                          <p><strong>Cliente:</strong> ${t.clienteNombre || 'N/A'} ${t.clienteTelefono ? `- Tel: ${t.clienteTelefono}`: ''}</p>
                          <p><strong>Monto Total Presupuestado:</strong> <span style="font-weight:bold; color: #4CAF50;">$${t.total ? t.total.toFixed(2) : '0.00'}</span></p>
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
                              <label for="estado-trabajo-select-${id}" style="display:inline-block; margin-right:5px;">Cambiar Estado:</label>
                              <select id="estado-trabajo-select-${id}" data-trabajo-id="${id}" class="cambiar-estado-trabajo-select">
                                  <option value="Pendiente" ${t.estadoTrabajo === 'Pendiente' ? 'selected' : ''}>Pendiente</option>
                                  <option value="En Proceso" ${t.estadoTrabajo === 'En Proceso' ? 'selected' : ''}>En Proceso</option>
                                  <option value="Completado" ${t.estadoTrabajo === 'Completado' ? 'selected' : ''}>Completado</option>
                                  <option value="Cancelado" ${t.estadoTrabajo === 'Cancelado' ? 'selected' : ''}>Cancelado</option>
                              </select>
                              <button class="btn-action confirmar-cambio-estado" data-trabajo-id="${id}" style="background-color:#007bff; margin-left:10px;">Confirmar Estado</button>
                          </div>
                      </div>
                  </div>`;
          });
          listaTrabajosDiv.innerHTML = trabajosHTML;

          listaTrabajosDiv.addEventListener('click', async (e) => {
              const target = e.target;
              const header = target.closest('.trabajo-header'); // Para asegurar que el clic en hijos del header también funcione
              const trabajoItem = target.closest('.trabajo-item');

              if (header && trabajoItem) { // Si se hizo clic en un header o su hijo
                  trabajoItem.classList.toggle('open');
                  return; // Evitar que otros listeners en el mismo clic se activen si no es necesario
              }

              if (target.classList.contains('btn-ver-imagen-novedad')) {
                  const imageUrl = target.dataset.imageUrl;
                  if (imageUrl && modalVerImagenNovedad && imgVisualizadorNovedad) {
                      imgVisualizadorNovedad.src = imageUrl;
                      modalVerImagenNovedad.style.display = "block";
                  }
              } else if (target.classList.contains('btn-edit-novedad')) {
                  const trabajoId = target.dataset.trabajoId;
                  const novedadIndex = parseInt(target.dataset.novedadIndex);
                  const descripcionActual = target.dataset.descripcion;
                  abrirModalEditarNovedad(trabajoId, novedadIndex, descripcionActual);
              } else if (target.classList.contains('btn-delete-novedad')) {
                  const trabajoId = target.dataset.trabajoId;
                  const novedadIndex = parseInt(target.dataset.novedadIndex);
                  const imageUrl = target.dataset.imageUrl;
                  await eliminarNovedadDeTrabajo(trabajoId, novedadIndex, imageUrl);
              } else if (target.classList.contains('confirmar-cambio-estado')) {
                  const trabajoId = target.dataset.trabajoId;
                  const selectEstado = document.getElementById(`estado-trabajo-select-${trabajoId}`);
                  if (selectEstado) {
                    await actualizarEstadoTrabajo(trabajoId, selectEstado.value);
                  }
              }
          });

          listaTrabajosDiv.querySelectorAll('.form-agregar-novedad').forEach(form => {
            if (!form.dataset.listenerAttached) { // Evitar duplicar listeners
                form.addEventListener('submit', async (e) => {
                    e.preventDefault();
                    const trabajoId = e.target.dataset.trabajoId;
                    const descripcionInput = document.getElementById(`novedad-descripcion-form-${trabajoId}`); // Corregido ID
                    const imagenInput = document.getElementById(`novedad-imagen-${trabajoId}`);
                    const descripcionNovedad = descripcionInput ? descripcionInput.value.trim() : "";
                    const imagenFile = imagenInput && imagenInput.files.length > 0 ? imagenInput.files[0] : null;
                    if (!descripcionNovedad && !imagenFile) {
                        alert("Debes añadir una descripción o una imagen para la novedad."); return;
                    }
                    await agregarNovedadAlTrabajo(trabajoId, imagenFile, descripcionNovedad, e.target);
                });
                form.dataset.listenerAttached = 'true';
            }
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
                          try { imageUrl = await uploadTask.snapshot.ref.getDownloadURL(); resolve(); }
                          catch (getUrlError){ reject(getUrlError); }
                      }
                  );
              });
          }
          const nuevaNovedad = {
              descripcion: descripcionNovedad || (imageUrl ? "Imagen adjunta" : "Actualización sin descripción"),
              imageUrl: imageUrl,
              fecha: firebase.firestore.FieldValue.serverTimestamp()
          };
          const trabajoRef = db.collection("trabajos_en_curso").doc(trabajoId);
          await trabajoRef.update({ novedades: firebase.firestore.FieldValue.arrayUnion(nuevaNovedad) });
          alert("Novedad agregada con éxito.");
          formElement.reset();
          if (progressContainer) progressContainer.style.display = 'none';
          if (progressBar) progressBar.textContent = '';
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
      try {
          const trabajoRef = db.collection("trabajos_en_curso").doc(trabajoId);
          let datosActualizar = { estadoTrabajo: nuevoEstado };
          if (nuevoEstado === 'Completado') {
            datosActualizar.fechaCompletado = firebase.firestore.FieldValue.serverTimestamp();
            datosActualizar.fechaCancelado = firebase.firestore.FieldValue.delete();
          } else if (nuevoEstado === 'Cancelado') {
            datosActualizar.fechaCancelado = firebase.firestore.FieldValue.serverTimestamp();
            datosActualizar.fechaCompletado = firebase.firestore.FieldValue.delete();
          } else {
            datosActualizar.fechaCompletado = firebase.firestore.FieldValue.delete();
            datosActualizar.fechaCancelado = firebase.firestore.FieldValue.delete();
          }
          await trabajoRef.update(datosActualizar);
      } catch (error) {
          console.error("Error al actualizar estado del trabajo:", error);
          alert("Error al actualizar el estado: " + error.message);
      }
  }

  function abrirModalEditarNovedad(trabajoId, novedadIndex, descripcionActual) {
      if (!modalEditarNovedad || !inputTrabajoIdEditarNovedad || !inputNovedadIndexEditarNovedad || !textareaDescripcionNovedadEditar) return;
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
            alert("Faltan datos o la descripción está vacía."); return;
        }
        const submitButton = formEditarNovedad.querySelector('button[type="submit"]');
        submitButton.disabled = true; submitButton.textContent = 'Guardando...';
        try {
            const trabajoRef = db.collection("trabajos_en_curso").doc(trabajoId);
            const docSnap = await trabajoRef.get();
            if (!docSnap.exists()) throw new Error("Trabajo no encontrado");
            let novedades = docSnap.data().novedades || [];
            if (novedadIndex >= 0 && novedadIndex < novedades.length) {
                const novedadActualizada = { ...novedades[novedadIndex], descripcion: nuevaDescripcion };
                novedades[novedadIndex] = novedadActualizada;
                await trabajoRef.update({ novedades: novedades });
                alert("Descripción de la novedad actualizada.");
                if (modalEditarNovedad) modalEditarNovedad.style.display = "none";
            } else { alert("Índice de novedad inválido."); }
        } catch (error) {
            console.error("Error al actualizar descripción de novedad:", error);
            alert("Error al actualizar: " + error.message);
        } finally {
            submitButton.disabled = false; submitButton.textContent = 'Guardar Cambios';
        }
    });
  }

  async function eliminarNovedadDeTrabajo(trabajoId, novedadIndex, imageUrl) {
      if (!confirm("¿Estás seguro de eliminar esta novedad?")) return;
      try {
          const trabajoRef = db.collection("trabajos_en_curso").doc(trabajoId);
          const docSnap = await trabajoRef.get();
          if (!docSnap.exists()) throw new Error("Trabajo no encontrado");
          let novedades = docSnap.data().novedades || [];
          if (novedadIndex >= 0 && novedadIndex < novedades.length) {
              const novedadAEliminar = novedades.splice(novedadIndex, 1)[0];
              if (novedadAEliminar && novedadAEliminar.imageUrl) {
                  try {
                      const imageRef = storage.refFromURL(novedadAEliminar.imageUrl);
                      await imageRef.delete();
                  } catch (storageError) {
                      console.warn("Advertencia al eliminar imagen de Storage:", storageError.message);
                  }
              }
              await trabajoRef.update({ novedades: novedades });
              alert("Novedad eliminada.");
          } else { alert("Índice de novedad inválido."); }
      } catch (error) {
          console.error("Error al eliminar novedad:", error);
          alert("Error al eliminar la novedad: " + error.message);
      }
  }

  if (filtroEstadoTrabajoSelect) {
      filtroEstadoTrabajoSelect.addEventListener('change', (e) => mostrarTrabajos(e.target.value));
  }
  mostrarTrabajos();
});