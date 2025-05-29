document.addEventListener('DOMContentLoaded', function() {
  // Lógica Menú Hamburguesa (si no está en un script global)
  const adminMenuToggle = document.getElementById('adminMenuToggle');
  const adminMenu = document.getElementById('adminMenu'); 
  if (adminMenuToggle && adminMenu) {
    adminMenuToggle.addEventListener('click', function() {
      adminMenu.classList.toggle('admin-menu-open');
      const isExpanded = adminMenu.classList.contains('admin-menu-open');
      this.setAttribute('aria-expanded', isExpanded);
      this.innerHTML = isExpanded ? '&times;' : '&#9776;';
      this.setAttribute('aria-label', isExpanded ? 'Cerrar menú' : 'Abrir menú');
    });
  }

  if (typeof db === 'undefined' || typeof storage === 'undefined' || typeof firebase === 'undefined') {
    console.error("Firebase no está inicializado. Verifica script.js.");
    alert("Error crítico: No se pudo conectar a Firebase.");
    return; 
  }

  const formIngresoVehiculo = document.getElementById('form-ingreso-vehiculo');
  const listaVehiculosDiv = document.getElementById('lista-vehiculos');
  const previsualizacionImagenesDiv = document.getElementById('previsualizacion-imagenes');
  const inputImagenesVehiculo = document.getElementById('vehiculo-imagenes');
  
  const modalEditarVehiculo = document.getElementById('modal-editar-vehiculo');
  const btnCerrarModalEditar = document.getElementById('cerrar-modal-editar-vehiculo');
  const formEditarVehiculo = document.getElementById('form-editar-vehiculo');
  const inputImagenesEditar = document.getElementById('vehiculo-imagenes-editar');
  const previsualizacionImagenesEditarDiv = document.getElementById('previsualizacion-imagenes-editar');
  const imagenesActualesEditarDiv = document.getElementById('imagenes-actuales-editar');

  const modalVerImagenesVehiculo = document.getElementById('modal-ver-imagenes-vehiculo');
  const btnCerrarModalVerImagenesVehiculo = document.getElementById('cerrar-modal-ver-imagenes-vehiculo');
  const galeriaImagenesVehiculoDiv = document.getElementById('galeria-imagenes-vehiculo');
  const modalVerImagenesVehiculoTitulo = document.getElementById('modal-ver-imagenes-vehiculo-titulo');

  window.imagenesAEliminarDelVehiculo = []; 
  let vehiculosAbiertosAntesDeActualizar = new Set();


  // --- MANEJO DE MODALES ---
  if (btnCerrarModalEditar && modalEditarVehiculo) {
    btnCerrarModalEditar.onclick = () => { modalEditarVehiculo.style.display = "none"; }
  }
  if (btnCerrarModalVerImagenesVehiculo && modalVerImagenesVehiculo) {
    btnCerrarModalVerImagenesVehiculo.onclick = () => { modalVerImagenesVehiculo.style.display = "none"; }
  }
  window.addEventListener('click', function(event) {
    if (event.target == modalEditarVehiculo && modalEditarVehiculo) modalEditarVehiculo.style.display = "none";
    if (event.target == modalVerImagenesVehiculo && modalVerImagenesVehiculo) modalVerImagenesVehiculo.style.display = "none";
  });

  // --- PREVISUALIZACIÓN DE IMÁGENES ---
  function configurarPrevisualizador(inputElement, previewContainerElement, maxFiles = 5) {
    if (inputElement && previewContainerElement) {
      inputElement.addEventListener('change', function(event) {
        previewContainerElement.innerHTML = '';
        const files = event.target.files;
        if (files.length > maxFiles) {
          alert(`Puedes subir un máximo de ${maxFiles} imágenes.`);
          inputElement.value = ""; return;
        }
        for (const file of files) {
          if (!file.type.startsWith('image/')) {
            alert(`El archivo "${file.name}" no es una imagen.`); continue;
          }
          const reader = new FileReader();
          reader.onload = (e) => {
            const img = document.createElement('img');
            img.src = e.target.result;
            previewContainerElement.appendChild(img);
          }
          reader.readAsDataURL(file);
        }
      });
    }
  }
  configurarPrevisualizador(inputImagenesVehiculo, previsualizacionImagenesDiv);
  // La previsualización para el modal de edición es un poco más compleja por las imágenes existentes
  if (inputImagenesEditar && previsualizacionImagenesEditarDiv && imagenesActualesEditarDiv) {
    inputImagenesEditar.addEventListener('change', function(event) {
      previsualizacionImagenesEditarDiv.innerHTML = '';
      const files = event.target.files;
      const numImagenesActualesVisibles = Array.from(imagenesActualesEditarDiv.children)
                                          .filter(child => child.tagName === 'DIV' && child.style.opacity !== '0.3').length;
      const maxNuevasImagenes = 5 - numImagenesActualesVisibles;
      if (files.length > maxNuevasImagenes) {
        alert(`Puedes añadir un máximo de ${maxNuevasImagenes} imágenes nuevas (total 5).`);
        inputImagenesEditar.value = ""; return;
      }
      for (const file of files) { /* ... (código de previsualización como antes) ... */ 
        const reader = new FileReader();
        reader.onload = function(e) { 
          const img = document.createElement('img'); img.src = e.target.result;
          previsualizacionImagenesEditarDiv.appendChild(img);
        }
        reader.readAsDataURL(file);
      }
    });
  }


  // --- CRUD DE VEHÍCULOS ---
  async function mostrarVehiculos() {
      if (!listaVehiculosDiv) return;
      
      vehiculosAbiertosAntesDeActualizar.clear();
      listaVehiculosDiv.querySelectorAll('.vehiculo-item.open').forEach(itemAbierto => {
          vehiculosAbiertosAntesDeActualizar.add(itemAbierto.id);
      });

      // listaVehiculosDiv.innerHTML = '<p>Cargando vehículos...</p>'; // Evita parpadeo si ya hay datos
      try {
        const querySnapshot = await db.collection("vehiculos").orderBy("registradoEl", "desc").get();
        if (querySnapshot.empty) {
          listaVehiculosDiv.innerHTML = '<p>Aún no hay vehículos registrados.</p>';
          return;
        }
        let vehiculosHTML = "";
        querySnapshot.forEach(doc => {
          const vehiculo = doc.data();
          const vehiculoId = doc.id;
          const vehiculoItemId = `vehiculo-item-${vehiculoId}`;
          const estabaAbierto = vehiculosAbiertosAntesDeActualizar.has(vehiculoItemId) ? 'open' : '';

          const encabezadoVehiculo = `${vehiculo.patente || 'S/P'} ${vehiculo.marca || 'S/M'} ${vehiculo.modelo || ''} - ${vehiculo.clienteNombre || 'Cliente Desc.'}`.trim();

          vehiculosHTML += `
            <div class="vehiculo-item ${estabaAbierto}" id="${vehiculoItemId}">
              <div class="vehiculo-header">
                <h4>${encabezadoVehiculo}</h4>
                <span class="estado-vehiculo-placeholder"></span> </div>
              <div class="vehiculo-content">
                <p><strong>ID Firestore:</strong> ${vehiculoId}</p>
                <p><strong>Año:</strong> ${vehiculo.ano || 'N/A'}</p>
                <p><strong>VIN:</strong> ${vehiculo.vin || 'N/A'}</p>
                <p><strong>Teléfono Cliente:</strong> ${vehiculo.clienteTelefono || 'N/A'}</p>
                <p><strong>Descripción Trabajo/Problema:</strong><br>${(vehiculo.descripcionTrabajo || 'N/A').replace(/\n/g, '<br>')}</p>
                ${vehiculo.imagenes && vehiculo.imagenes.length > 0 ?
                  `<button class="btn-action btn-ver-imagenes-vehiculo" data-vehiculo-id="${vehiculoId}" data-patente="${vehiculo.patente || 'Vehículo'}">Ver Imágenes (${vehiculo.imagenes.length})</button>`
                  : '<p>No hay imágenes.</p>'}
                <p style="font-size: 0.8em; color: #888; margin-top: 10px;">Registrado: ${vehiculo.registradoEl && vehiculo.registradoEl.seconds ? new Date(vehiculo.registradoEl.seconds * 1000).toLocaleString() : 'N/A'}</p>
                <div style="margin-top:10px;">
                  <button class="btn-action btn-edit" data-id="${vehiculoId}">Editar</button>
                  <button class="btn-action btn-delete" data-id="${vehiculoId}">Eliminar</button>
                </div>
              </div>
            </div>`;
        });
        listaVehiculosDiv.innerHTML = vehiculosHTML;
      } catch (error) {
        console.error("Error al mostrar vehículos: ", error);
        if (listaVehiculosDiv) listaVehiculosDiv.innerHTML = '<p style="color:red;">Error al cargar los vehículos.</p>';
      }
  }

  // Listener delegado para la lista de vehículos
  if (listaVehiculosDiv) {
    listaVehiculosDiv.addEventListener('click', function(event) {
        const target = event.target;
        const header = target.closest('.vehiculo-header');
        const vehiculoItem = target.closest('.vehiculo-item');

        if (header && vehiculoItem) { // Clic en el header para desplegar/colapsar
            vehiculoItem.classList.toggle('open');
            if (vehiculoItem.classList.contains('open')) {
                vehiculosAbiertosAntesDeActualizar.add(vehiculoItem.id);
            } else {
                vehiculosAbiertosAntesDeActualizar.delete(vehiculoItem.id);
            }
        } else if (target.classList.contains('btn-edit')) {
            abrirModalEditarVehiculo(target.dataset.id);
        } else if (target.classList.contains('btn-delete')) {
            eliminarVehiculo(target.dataset.id);
        } else if (target.classList.contains('btn-ver-imagenes-vehiculo')) {
            const vehiculoId = target.dataset.vehiculoId;
            const patente = target.dataset.patente;
            abrirModalVerImagenes(vehiculoId, patente);
        }
    });
  }
  
  async function abrirModalVerImagenes(vehiculoId, patente) {
    if (!modalVerImagenesVehiculo || !galeriaImagenesVehiculoDiv || !modalVerImagenesVehiculoTitulo) return;
    try {
        const docRef = db.collection("vehiculos").doc(vehiculoId);
        const docSnap = await docRef.get();
        if (docSnap.exists) {
            const vehiculo = docSnap.data();
            modalVerImagenesVehiculoTitulo.textContent = `Imágenes de: ${patente || vehiculo.patente || 'Vehículo'}`;
            galeriaImagenesVehiculoDiv.innerHTML = ''; // Limpiar galería anterior
            if (vehiculo.imagenes && vehiculo.imagenes.length > 0) {
                vehiculo.imagenes.forEach(url => {
                    const img = document.createElement('img');
                    img.src = url;
                    img.alt = `Imagen de ${patente}`;
                    img.onclick = () => window.open(url, '_blank'); // Abrir en nueva pestaña al hacer clic
                    galeriaImagenesVehiculoDiv.appendChild(img);
                });
            } else {
                galeriaImagenesVehiculoDiv.innerHTML = '<p>Este vehículo no tiene imágenes.</p>';
            }
            modalVerImagenesVehiculo.style.display = 'block';
        } else {
            alert("Vehículo no encontrado.");
        }
    } catch(error) {
        console.error("Error al cargar imágenes del vehículo:", error);
        alert("No se pudieron cargar las imágenes: " + error.message);
    }
  }


  async function abrirModalEditarVehiculo(vehiculoId) {
      if (!modalEditarVehiculo || !imagenesActualesEditarDiv || !previsualizacionImagenesEditarDiv || !inputImagenesEditar) return;
      window.imagenesAEliminarDelVehiculo = []; 
      try {
          const docRef = db.collection("vehiculos").doc(vehiculoId);
          const docSnap = await docRef.get();
          if (docSnap.exists) {
              const data = docSnap.data();
              document.getElementById('vehiculo-id-editar').value = vehiculoId;
              document.getElementById('vehiculo-patente-editar').value = data.patente || '';
              document.getElementById('vehiculo-marca-editar').value = data.marca || '';
              document.getElementById('vehiculo-modelo-editar').value = data.modelo || '';
              document.getElementById('vehiculo-ano-editar').value = data.ano || '';
              document.getElementById('vehiculo-vin-editar').value = data.vin || ''; // Cargar VIN
              document.getElementById('vehiculo-cliente-nombre-editar').value = data.clienteNombre || '';
              document.getElementById('vehiculo-cliente-telefono-editar').value = data.clienteTelefono || '+569'; // Default teléfono
              document.getElementById('vehiculo-descripcion-trabajo-editar').value = data.descripcionTrabajo || '';
              
              imagenesActualesEditarDiv.innerHTML = ''; 
              if (data.imagenes && data.imagenes.length > 0) {
                  data.imagenes.forEach((url) => {
                      const imgContainer = document.createElement('div');
                      imgContainer.classList.add('img-container-editable');
                      const img = document.createElement('img'); img.src = url; 
                      imgContainer.appendChild(img);
                      const removeBtn = document.createElement('button');
                      removeBtn.textContent = 'X'; removeBtn.type = 'button';
                      removeBtn.classList.add('remove-img-btn');
                      removeBtn.title = 'Marcar para eliminar';
                      removeBtn.onclick = function() { /* ... (lógica de marcar/desmarcar como antes) ... */ 
                          if (imgContainer.style.opacity === '0.3') { 
                            imgContainer.style.opacity = '1';
                            window.imagenesAEliminarDelVehiculo = window.imagenesAEliminarDelVehiculo.filter(itemUrl => itemUrl !== url);
                            removeBtn.style.background = 'rgba(255,0,0,0.7)'; removeBtn.title = 'Marcar para eliminar';
                          } else { 
                            imgContainer.style.opacity = '0.3'; 
                            if (!window.imagenesAEliminarDelVehiculo.includes(url)) window.imagenesAEliminarDelVehiculo.push(url);
                            removeBtn.style.background = 'rgba(0,128,0,0.7)'; removeBtn.title = 'Desmarcar';
                          }
                      };
                      imgContainer.appendChild(removeBtn);
                      imagenesActualesEditarDiv.appendChild(imgContainer);
                  });
              } else { 
                  imagenesActualesEditarDiv.innerHTML = '<p style="font-size:0.9em; color:#aaa;">Sin imágenes actuales.</p>'; 
              }
              previsualizacionImagenesEditarDiv.innerHTML = ''; 
              inputImagenesEditar.value = ''; 
              modalEditarVehiculo.style.display = "block";
          } else { 
              alert("Error: Vehículo no encontrado."); 
          }
      } catch (error) { 
          console.error("Error al cargar datos para editar:", error);
          alert("Error al cargar datos: " + error.message); 
      }
  }

  async function eliminarVehiculo(vehiculoId) {
      if (!confirm("¿Seguro de eliminar este vehículo y sus imágenes?")) return;
      try {
          const vehiculoRef = db.collection("vehiculos").doc(vehiculoId);
          const docSnap = await vehiculoRef.get();
          if (docSnap.exists) {
              const vehiculoData = docSnap.data();
              if (vehiculoData.imagenes && vehiculoData.imagenes.length > 0) {
                  const deletePromises = vehiculoData.imagenes.map(imageUrl => {
                      try {
                          const imageRef = storage.refFromURL(imageUrl);
                          return imageRef.delete().catch(err => console.warn("Storage delete warning:", err));
                      } catch (e) { return Promise.resolve(); }
                  });
                  await Promise.all(deletePromises);
              }
              await vehiculoRef.delete();
              alert("Vehículo eliminado.");
              mostrarVehiculos();
          } else { alert("Error: Vehículo no existe."); }
      } catch (error) { alert("Error al eliminar: " + error.message); console.error(error); }
  }

  if (formIngresoVehiculo) {
    formIngresoVehiculo.addEventListener('submit', async function(event) {
      event.preventDefault();
      const submitButton = formIngresoVehiculo.querySelector('button[type="submit"]');
      if (submitButton.disabled) return;
      submitButton.disabled = true; submitButton.textContent = 'Guardando...';
      
      const patente = document.getElementById('vehiculo-patente').value.trim().toUpperCase();
      const vin = document.getElementById('vehiculo-vin').value.trim().toUpperCase(); // Obtener VIN
      // ... (obtener otros campos como antes)
      const marca = document.getElementById('vehiculo-marca').value.trim();
      const modelo = document.getElementById('vehiculo-modelo').value.trim();
      const ano = document.getElementById('vehiculo-ano').value;
      const clienteNombre = document.getElementById('vehiculo-cliente-nombre').value.trim();
      let clienteTelefono = document.getElementById('vehiculo-cliente-telefono').value.trim();
      const descripcionTrabajo = document.getElementById('vehiculo-descripcion-trabajo').value.trim();
      const files = inputImagenesVehiculo ? inputImagenesVehiculo.files : [];
      let urlsImagenes = [];

      // Validar teléfono para que al menos tenga el prefijo si se va a guardar
      if (clienteTelefono.length > 0 && !clienteTelefono.startsWith('+569') && clienteTelefono.length <=9) {
          if(clienteTelefono.length === 9 && clienteTelefono.startsWith('9')){
            clienteTelefono = '+56' + clienteTelefono;
          } else if (clienteTelefono.length < 9) {
             // No hacer nada, o validar más estrictamente
          }
      } else if (clienteTelefono === "+56" || clienteTelefono === "+569") {
          clienteTelefono = ""; // Si solo es el prefijo, no guardar nada o guardar vacío
      }


      if (!patente || !marca || !modelo || !ano || !descripcionTrabajo) {
          alert("Patente, Marca, Modelo, Año y Descripción son obligatorios.");
          submitButton.disabled = false; submitButton.textContent = 'Guardar Vehículo'; return;
      }
      // ... (validación de files.length > 5)
      try {
        if (files.length > 0) { /* ... (lógica de subida de imágenes) ... */ 
            const uploadPromises = Array.from(files).map(file => {
              if (!file.type.startsWith('image/')) throw new Error(`"${file.name}" no es imagen.`);
              const filePath = `vehiculos/${patente.replace(/[^a-zA-Z0-9]/g, '_')}/${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
              const fileRef = storage.ref().child(filePath);
              return fileRef.put(file).then(snapshot => snapshot.ref.getDownloadURL());
          });
          urlsImagenes = await Promise.all(uploadPromises);
        }
        const nuevoVehiculo = {
            patente, marca, modelo, ano: parseInt(ano), vin, // Añadir VIN
            clienteNombre, clienteTelefono, descripcionTrabajo, 
            imagenes: urlsImagenes, registradoEl: firebase.firestore.FieldValue.serverTimestamp()
        };
        await db.collection("vehiculos").add(nuevoVehiculo);
        alert("¡Vehículo guardado!");
        formIngresoVehiculo.reset();
        document.getElementById('vehiculo-cliente-telefono').value = '+569'; // Resetear teléfono al valor por defecto
        if (previsualizacionImagenesDiv) previsualizacionImagenesDiv.innerHTML = '';
        if (inputImagenesVehiculo) inputImagenesVehiculo.value = '';
        mostrarVehiculos(); 
      } catch (error) { alert("Error al guardar vehículo: " + error.message); }
      finally { submitButton.disabled = false; submitButton.textContent = 'Guardar Vehículo'; }
    });
  }
  
  if (formEditarVehiculo) {
      formEditarVehiculo.addEventListener('submit', async function(event) {
          event.preventDefault();
          const vehiculoId = document.getElementById('vehiculo-id-editar').value;
          if (!vehiculoId) { alert("Error: ID de vehículo no encontrado."); return; }
          const submitButton = formEditarVehiculo.querySelector('button[type="submit"]');
          if (submitButton.disabled) return;
          submitButton.disabled = true; submitButton.textContent = 'Guardando Cambios...';
          
          const patenteVehiculo = document.getElementById('vehiculo-patente-editar').value.trim().toUpperCase();
          const vinEditado = document.getElementById('vehiculo-vin-editar').value.trim().toUpperCase(); // Obtener VIN editado
          let clienteTelefonoEditado = document.getElementById('vehiculo-cliente-telefono-editar').value.trim();
          // ... (validación de teléfono editado similar a la de ingreso)

          let urlsNuevasImagenes = [];
          const filesParaSubir = inputImagenesEditar ? inputImagenesEditar.files : [];
          try {
              if (filesParaSubir && filesParaSubir.length > 0) { /* ... (lógica de subida) ... */
                const uploadPromises = Array.from(filesParaSubir).map(file => {
                    if (!file.type.startsWith('image/')) throw new Error(`"${file.name}" no es imagen.`);
                    const filePath = `vehiculos/${patenteVehiculo.replace(/[^a-zA-Z0-9]/g, '_')}/edit_${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
                    const fileRef = storage.ref().child(filePath);
                    return fileRef.put(file).then(snapshot => snapshot.ref.getDownloadURL());
                });
                urlsNuevasImagenes = await Promise.all(uploadPromises);
              }
              const vehiculoDocActual = await db.collection("vehiculos").doc(vehiculoId).get();
              let imagenesActualesEnFirestore = (vehiculoDocActual.exists && vehiculoDocActual.data().imagenes) ? vehiculoDocActual.data().imagenes : [];

              if (window.imagenesAEliminarDelVehiculo && window.imagenesAEliminarDelVehiculo.length > 0) { /* ... (lógica de borrado de Storage) ... */ 
                const deleteStoragePromises = window.imagenesAEliminarDelVehiculo.map(url => {
                    try {
                        const imageRef = storage.refFromURL(url);
                        return imageRef.delete().catch(err => console.warn("No se pudo borrar de Storage:", url, err));
                    } catch (e) { return Promise.resolve(); }
                });
                await Promise.all(deleteStoragePromises);
              }
              let imagenesFinales = imagenesActualesEnFirestore.filter(url => !(window.imagenesAEliminarDelVehiculo && window.imagenesAEliminarDelVehiculo.includes(url)));
              imagenesFinales = imagenesFinales.concat(urlsNuevasImagenes);
              if (imagenesFinales.length > 5) {
                  alert("Límite de 5 imágenes excedido. Se guardarán las primeras 5.");
                  imagenesFinales = imagenesFinales.slice(0, 5);
              }
              const datosActualizados = {
                  patente: patenteVehiculo,
                  marca: document.getElementById('vehiculo-marca-editar').value.trim(),
                  modelo: document.getElementById('vehiculo-modelo-editar').value.trim(),
                  ano: parseInt(document.getElementById('vehiculo-ano-editar').value),
                  vin: vinEditado, // Guardar VIN editado
                  clienteNombre: document.getElementById('vehiculo-cliente-nombre-editar').value.trim(),
                  clienteTelefono: clienteTelefonoEditado,
                  descripcionTrabajo: document.getElementById('vehiculo-descripcion-trabajo-editar').value.trim(),
                  imagenes: imagenesFinales,
                  actualizadoEl: firebase.firestore.FieldValue.serverTimestamp()
              };
              if (!datosActualizados.patente || !datosActualizados.marca || !datosActualizados.modelo || !datosActualizados.ano) {
                  throw new Error("Patente, Marca, Modelo y Año son obligatorios.");
              }
              await db.collection("vehiculos").doc(vehiculoId).update(datosActualizados);
              alert("¡Vehículo actualizado!");
              if(modalEditarVehiculo) modalEditarVehiculo.style.display = "none";
              mostrarVehiculos();
          } catch (error) { alert("Error al actualizar vehículo: " + error.message); }
          finally {
              submitButton.disabled = false; submitButton.textContent = 'Guardar Cambios';
              window.imagenesAEliminarDelVehiculo = []; 
              if (inputImagenesEditar) inputImagenesEditar.value = '';
              if (previsualizacionImagenesEditarDiv) previsualizacionImagenesEditarDiv.innerHTML = '';
          }
      });
  }
  mostrarVehiculos();
});