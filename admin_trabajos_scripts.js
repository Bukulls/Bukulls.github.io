document.addEventListener('DOMContentLoaded', function() {
  if (typeof db === 'undefined' || typeof storage === 'undefined') {
    console.error("Firebase (db y storage) no están inicializados.");
    alert("Error crítico: No se pudo conectar a los servicios de Firebase.");
    return;
  }

  const listaTrabajosDiv = document.getElementById('lista-trabajos');
  const filtroEstadoTrabajoSelect = document.getElementById('filtro-estado-trabajo');

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
                  t.novedades.slice().reverse().forEach(nov => {
                      console.log('Datos de la novedad al mostrar:', nov); // LOG PARA VERIFICAR DATOS
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
                              <p><strong>Descripción:</strong> ${nov.descripcion || 'N/A'}</p>
                              ${nov.imageUrl ? `<img src="${nov.imageUrl}" alt="Imagen novedad ${nov.descripcion || ''}">` : '<p style="color:orange;">(No se adjuntó imagen para esta novedad)</p>'}
                              <p style="font-size:0.8em; color:#888;">Fecha: ${fechaNovedadStr}</p>
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
                            <textarea id="novedad-descripcion-${id}" rows="2"></textarea> <label for="novedad-imagen-${id}">Imagen (Opcional):</label>
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

          listaTrabajosDiv.querySelectorAll('.form-agregar-novedad').forEach(form => {
              form.addEventListener('submit', async (e) => {
                  e.preventDefault();
                  const trabajoId = e.target.dataset.trabajoId;
                  const descripcionInput = document.getElementById(`novedad-descripcion-${trabajoId}`);
                  const imagenInput = document.getElementById(`novedad-imagen-${trabajoId}`);

                  const descripcionNovedad = descripcionInput ? descripcionInput.value.trim() : "";
                  const imagenFile = imagenInput && imagenInput.files.length > 0 ? imagenInput.files[0] : null;

                  if (!descripcionNovedad && !imagenFile) {
                      alert("Debes añadir una descripción o una imagen para la novedad.");
                      return;
                  }
                  await agregarNovedadAlTrabajo(trabajoId, imagenFile, descripcionNovedad, e.target);
              });
          });

          listaTrabajosDiv.querySelectorAll('.confirmar-cambio-estado').forEach(button => {
              button.addEventListener('click', async (e) => {
                  const trabajoId = e.target.dataset.trabajoId;
                  const selectEstado = document.getElementById(`estado-trabajo-${trabajoId}`);
                  const nuevoEstado = selectEstado.value;
                  // ... resto de la lógica del botón confirmar ...
                  await actualizarEstadoTrabajo(trabajoId, nuevoEstado); // Quitar confirm si ya se hizo
              });
          });

          listaTrabajosDiv.querySelectorAll('.cambiar-estado-trabajo-select').forEach(select => {
              select.addEventListener('focus', function () { this.previousValue = this.value; });
              select.addEventListener('change', async (e) => {
                // ... (lógica para decidir si actualizar directo o esperar confirmación) ...
                  const trabajoId = e.target.dataset.trabajoId;
                  const nuevoEstado = e.target.value;
                  // Si no es un estado final, o si quieres actualizar al cambiar el select (sin botón confirmar aparte)
                  if (nuevoEstado !== "Completado" && nuevoEstado !== "Cancelado") {
                     await actualizarEstadoTrabajo(trabajoId, nuevoEstado);
                  }
                  // Si es estado final, el botón "Confirmar Cambio de Estado" manejará la lógica
              });
          });

      }, error => { console.error("Error onSnapshot trabajos:", error); /* ... */ });
  }

  async function agregarNovedadAlTrabajo(trabajoId, imagenFile, descripcionNovedad, formElement) {
      const submitButton = formElement.querySelector('button[type="submit"]');
      const progressContainer = document.getElementById(`novedad-progress-container-${trabajoId}`);
      const progressBar = document.getElementById(`novedad-progress-bar-${trabajoId}`);

      submitButton.disabled = true;
      submitButton.textContent = 'Agregando...';

      let imageUrl = null; // Importante inicializar a null
      try {
          if (imagenFile) {
              if (progressContainer) progressContainer.style.display = 'block';
              if (progressBar) { progressBar.style.width = '0%'; progressBar.textContent = '0%';}

              const imageName = `${Date.now()}_${imagenFile.name.replace(/\s+/g, '_')}`;
              const storagePath = `trabajos_novedades/${trabajoId}/${imageName}`;
              const imageRef = storage.ref().child(storagePath);
              const uploadTask = imageRef.put(imagenFile);

              console.log("Iniciando subida de imagen para novedad...");
              await new Promise((resolve, reject) => {
                  uploadTask.on('state_changed',
                      (snapshot) => {
                          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                          if (progressBar) { progressBar.style.width = progress + '%'; progressBar.textContent = Math.round(progress) + '%';}
                          console.log('Upload novedad is ' + progress + '% done');
                      },
                      (error) => {
                          console.error("Error subiendo imagen de novedad:", error);
                          reject(error); // Rechazar la promesa si hay error
                      },
                      async () => {
                          try {
                              imageUrl = await uploadTask.snapshot.ref.getDownloadURL();
                              console.log('Imagen de novedad subida y URL obtenida:', imageUrl); // LOG
                              resolve(); // Resolver la promesa cuando la URL está lista
                          } catch (getUrlError){
                              console.error("Error obteniendo URL de descarga:", getUrlError);
                              reject(getUrlError);
                          }
                      }
                  );
              });
          }

          const nuevaNovedad = {
              descripcion: descripcionNovedad || (imageUrl ? "Imagen adjunta" : "Actualización sin descripción"), // Asegurar descripción
              imageUrl: imageUrl, // imageUrl será null si no se subió imagen
              fecha: new Date()
          };
          console.log('Objeto nuevaNovedad a guardar en Firestore:', nuevaNovedad); // LOG

          const trabajoRef = db.collection("trabajos_en_curso").doc(trabajoId);
          await trabajoRef.update({
              novedades: firebase.firestore.FieldValue.arrayUnion(nuevaNovedad)
          });

          alert("Novedad agregada con éxito.");
          formElement.reset();
          if (progressContainer) progressContainer.style.display = 'none';
      } catch (error) {
          console.error("Error al agregar novedad (catch general):", error);
          alert("Error al agregar la novedad: " + error.message);
      } finally {
          submitButton.disabled = false;
          submitButton.textContent = 'Agregar Novedad';
      }
  }

  async function actualizarEstadoTrabajo(trabajoId, nuevoEstado) {
      if (!trabajoId || !nuevoEstado) { alert("Faltan datos para actualizar."); return; }

      // La confirmación ahora se maneja en el listener del botón "Confirmar Cambio"
      // para los estados "Completado" y "Cancelado".
      // Aquí, simplemente procedemos con la actualización.

      console.log(`Actualizando trabajo ${trabajoId} a estado: ${nuevoEstado}`);
      try {
          const trabajoRef = db.collection("trabajos_en_curso").doc(trabajoId);
          let datosActualizar = { estadoTrabajo: nuevoEstado };

          if (nuevoEstado !== 'Completado') datosActualizar.fechaCompletado = firebase.firestore.FieldValue.delete();
          if (nuevoEstado !== 'Cancelado') datosActualizar.fechaCancelado = firebase.firestore.FieldValue.delete();

          if (nuevoEstado === 'Completado') datosActualizar.fechaCompletado = firebase.firestore.FieldValue.serverTimestamp();
          else if (nuevoEstado === 'Cancelado') datosActualizar.fechaCancelado = firebase.firestore.FieldValue.serverTimestamp();

          await trabajoRef.update(datosActualizar);
          // onSnapshot se encargará de refrescar la UI, así que el alert aquí puede ser opcional.
          // alert(`Estado del trabajo ID ${trabajoId.substring(0,8)} actualizado a: ${nuevoEstado}`);
      } catch (error) {
          console.error("Error al actualizar estado del trabajo:", error);
          alert("Error al actualizar el estado: " + error.message);
      }
  }


  if (filtroEstadoTrabajoSelect) {
      filtroEstadoTrabajoSelect.addEventListener('change', (e) => {
          mostrarTrabajos(e.target.value);
      });
  }

  if (typeof mostrarTrabajos === "function") {
    mostrarTrabajos();
  }
});