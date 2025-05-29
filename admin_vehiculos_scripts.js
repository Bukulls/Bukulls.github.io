document.addEventListener('DOMContentLoaded', function() {
  // Verificar si Firebase está inicializado desde script.js
  if (typeof db === 'undefined' || typeof storage === 'undefined' || typeof firebase === 'undefined') {
    console.error("Firebase (db, storage, o firebase) no está inicializado. Verifica que script.js se cargue correctamente ANTES de este script y que defina las variables globales necesarias.");
    alert("Error crítico: No se pudo conectar a la base de datos. Por favor, recarga o contacta soporte.");
    return; 
  }

  // --- Elementos DOM para Vehículos ---
  const formIngresoVehiculo = document.getElementById('form-ingreso-vehiculo');
  const listaVehiculosDiv = document.getElementById('lista-vehiculos');
  const previsualizacionImagenesDiv = document.getElementById('previsualizacion-imagenes');
  const inputImagenesVehiculo = document.getElementById('vehiculo-imagenes');
  
  // --- Modal de Edición de Vehículo ---
  const modalEditarVehiculo = document.getElementById('modal-editar-vehiculo');
  const btnCerrarModalEditar = document.getElementById('cerrar-modal-editar-vehiculo');
  const formEditarVehiculo = document.getElementById('form-editar-vehiculo');
  const inputImagenesEditar = document.getElementById('vehiculo-imagenes-editar');
  const previsualizacionImagenesEditarDiv = document.getElementById('previsualizacion-imagenes-editar');
  const imagenesActualesEditarDiv = document.getElementById('imagenes-actuales-editar');
  
  // Variable global para el modal de edición para rastrear imágenes a eliminar de Storage
  window.imagenesAEliminarDelVehiculo = []; 

  if (btnCerrarModalEditar && modalEditarVehiculo) {
    btnCerrarModalEditar.onclick = function() {
      modalEditarVehiculo.style.display = "none";
    }
  }
  // Cerrar modal si se hace clic fuera de su contenido
  window.addEventListener('click', function(event) {
    if (event.target == modalEditarVehiculo && modalEditarVehiculo) {
      modalEditarVehiculo.style.display = "none";
    }
  });


  if (inputImagenesEditar && previsualizacionImagenesEditarDiv && imagenesActualesEditarDiv) {
      inputImagenesEditar.addEventListener('change', function(event) {
        previsualizacionImagenesEditarDiv.innerHTML = ''; // Limpiar previsualizaciones anteriores de archivos nuevos
        const files = event.target.files;
        // Contar cuántas imágenes actuales NO están marcadas para eliminar
        const numImagenesActualesVisibles = Array.from(imagenesActualesEditarDiv.children)
            .filter(child => child.tagName === 'DIV' && child.style.opacity !== '0.3').length;
        
        const maxNuevasImagenes = 5 - numImagenesActualesVisibles;

        if (files.length > maxNuevasImagenes) {
            alert(`Puedes añadir un máximo de ${maxNuevasImagenes} imágenes nuevas (para un total de 5, incluyendo las actuales no eliminadas).`);
            inputImagenesEditar.value = ""; // Limpiar selección
            return;
        }
        for (const file of files) {
          const reader = new FileReader();
          reader.onload = function(e) { 
            const img = document.createElement('img');
            img.src = e.target.result;
            // Estilos ya definidos en CSS, pero se pueden reforzar aquí si es necesario
            // img.style.maxWidth = '80px'; img.style.maxHeight = '80px'; img.style.margin = '2px'; img.style.border = '1px solid #555';
            previsualizacionImagenesEditarDiv.appendChild(img);
          }
          reader.readAsDataURL(file);
        }
      });
  }

  async function mostrarVehiculos() {
      if (!listaVehiculosDiv) { console.error("Elemento listaVehiculosDiv no encontrado en el DOM."); return; }
      listaVehiculosDiv.innerHTML = '<p>Cargando vehículos...</p>';
      try {
        const querySnapshot = await db.collection("vehiculos").orderBy("registradoEl", "desc").get();
        if (querySnapshot.empty) {
          listaVehiculosDiv.innerHTML = '<p>Aún no hay vehículos registrados.</p>';
          return;
        }
        let vehiculosHTML = '<ul>'; // Iniciar la lista ul
        querySnapshot.forEach(doc => {
          const vehiculo = doc.data();
          const vehiculoId = doc.id;
          vehiculosHTML += `
            <li>
              <h4>Patente: ${vehiculo.patente || 'N/A'}</h4>
              <p><strong>ID:</strong> ${vehiculoId}</p>
              <p><strong>Marca:</strong> ${vehiculo.marca || 'N/A'} - <strong>Modelo:</strong> ${vehiculo.modelo || 'N/A'} - <strong>Año:</strong> ${vehiculo.ano || 'N/A'}</p>
              <p><strong>Cliente:</strong> ${vehiculo.clienteNombre || 'N/A'} ${vehiculo.clienteTelefono ? `- <strong>Teléfono:</strong> ${vehiculo.clienteTelefono}` : ''}</p>
              <p><strong>Descripción:</strong><br>${(vehiculo.descripcionTrabajo || 'N/A').replace(/\n/g, '<br>')}</p>
              ${vehiculo.imagenes && vehiculo.imagenes.length > 0 ?
                '<p style="margin-bottom: 5px;"><strong>Imágenes:</strong></p><div style="display: flex; flex-wrap: wrap; gap: 10px;">' + 
                vehiculo.imagenes.map(imgUrl => `<a href="${imgUrl}" target="_blank"><img src="${imgUrl}" alt="Imagen vehículo" style="width: 80px; height: 80px; object-fit: cover; border: 1px solid #444; border-radius: 3px;"></a>`).join('') + 
                '</div>'
                : '<p>No hay imágenes.</p>'}
              <p style="font-size: 0.8em; color: #888; margin-top: 10px;">Registrado el: ${vehiculo.registradoEl && vehiculo.registradoEl.seconds ? new Date(vehiculo.registradoEl.seconds * 1000).toLocaleString() : 'N/A'}</p>
              <div style="margin-top:10px;">
                <button class="btn-action btn-edit" data-id="${vehiculoId}">Editar</button>
                <button class="btn-action btn-delete" data-id="${vehiculoId}">Eliminar</button>
              </div>
            </li>`;
        });
        vehiculosHTML += '</ul>'; // Cerrar la lista ul
        listaVehiculosDiv.innerHTML = vehiculosHTML;

        // Re-asignar listeners a los nuevos botones
        listaVehiculosDiv.querySelectorAll('.btn-edit').forEach(btn => {
            btn.addEventListener('click', () => abrirModalEditarVehiculo(btn.dataset.id));
        });
        listaVehiculosDiv.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', () => eliminarVehiculo(btn.dataset.id));
        });
      } catch (error) {
        console.error("Error al mostrar vehículos: ", error);
        if (listaVehiculosDiv) listaVehiculosDiv.innerHTML = '<p style="color:red;">Error al cargar los vehículos.</p>';
      }
  }

  async function abrirModalEditarVehiculo(vehiculoId) {
      if (!modalEditarVehiculo || !imagenesActualesEditarDiv || !previsualizacionImagenesEditarDiv || !inputImagenesEditar) {
          console.error("Faltan elementos del DOM para el modal de edición.");
          return;
      }
      window.imagenesAEliminarDelVehiculo = []; // Resetear array de imágenes a eliminar
      try {
          const docRef = db.collection("vehiculos").doc(vehiculoId);
          const docSnap = await docRef.get();
          if (docSnap.exists) { // Corregido: .exists es una propiedad
              const data = docSnap.data();
              document.getElementById('vehiculo-id-editar').value = vehiculoId;
              document.getElementById('vehiculo-patente-editar').value = data.patente || '';
              document.getElementById('vehiculo-marca-editar').value = data.marca || '';
              document.getElementById('vehiculo-modelo-editar').value = data.modelo || '';
              document.getElementById('vehiculo-ano-editar').value = data.ano || '';
              document.getElementById('vehiculo-cliente-nombre-editar').value = data.clienteNombre || '';
              document.getElementById('vehiculo-cliente-telefono-editar').value = data.clienteTelefono || '';
              document.getElementById('vehiculo-descripcion-trabajo-editar').value = data.descripcionTrabajo || '';
              
              imagenesActualesEditarDiv.innerHTML = ''; 
              if (data.imagenes && data.imagenes.length > 0) {
                  data.imagenes.forEach((url) => {
                      const imgContainer = document.createElement('div');
                      imgContainer.style.position = 'relative'; 
                      imgContainer.style.margin = '2px';
                      imgContainer.style.border = '1px solid #666'; 
                      imgContainer.style.display = 'inline-block';
                      
                      const img = document.createElement('img');
                      img.src = url; 
                      // Estilos ya en CSS: img.style.width = '80px'; img.style.height = '80px'; img.style.objectFit = 'cover';
                      imgContainer.appendChild(img);
                      
                      const removeBtn = document.createElement('button');
                      removeBtn.textContent = 'X'; 
                      removeBtn.type = 'button';
                      removeBtn.title = 'Marcar para eliminar esta imagen al guardar';
                      removeBtn.style.position = 'absolute'; 
                      removeBtn.style.top = '0'; removeBtn.style.right = '0';
                      removeBtn.style.background = 'rgba(255,0,0,0.7)'; // Rojo para eliminar
                      removeBtn.style.color = 'white';
                      removeBtn.style.border = 'none'; 
                      removeBtn.style.cursor = 'pointer'; 
                      removeBtn.style.padding = '1px 4px';
                      removeBtn.style.fontSize = '0.8em';
                      removeBtn.style.borderRadius = '0 0 0 3px';

                      removeBtn.onclick = function() {
                          if (imgContainer.style.opacity === '0.3') { // Desmarcar
                            imgContainer.style.opacity = '1';
                            window.imagenesAEliminarDelVehiculo = window.imagenesAEliminarDelVehiculo.filter(itemUrl => itemUrl !== url);
                            removeBtn.style.background = 'rgba(255,0,0,0.7)';
                            removeBtn.title = 'Marcar para eliminar esta imagen al guardar';
                          } else { // Marcar para eliminar
                            imgContainer.style.opacity = '0.3'; 
                            if (!window.imagenesAEliminarDelVehiculo.includes(url)) {
                                window.imagenesAEliminarDelVehiculo.push(url);
                            }
                            removeBtn.style.background = 'rgba(0,128,0,0.7)'; // Verde para indicar que se deshará
                            removeBtn.title = 'Desmarcar esta imagen (no se eliminará al guardar)';
                          }
                      };
                      imgContainer.appendChild(removeBtn);
                      imagenesActualesEditarDiv.appendChild(imgContainer);
                  });
              } else { 
                  imagenesActualesEditarDiv.innerHTML = '<p style="font-size:0.9em; color:#aaa;">No hay imágenes actuales.</p>'; 
              }
              previsualizacionImagenesEditarDiv.innerHTML = ''; // Limpiar previsualización de nuevos archivos
              inputImagenesEditar.value = ''; // Limpiar el input file
              modalEditarVehiculo.style.display = "block";
          } else { 
              alert("Error: No se encontró el vehículo para editar."); 
          }
      } catch (error) { 
          console.error("Error al cargar datos del vehículo para editar:", error)
          alert("Error al cargar datos para editar: " + error.message); 
      }
  }

  async function eliminarVehiculo(vehiculoId) {
      if (!confirm("¿Estás seguro de eliminar este vehículo y todas sus imágenes asociadas? Esta acción no se puede deshacer.")) return;
      try {
          const vehiculoRef = db.collection("vehiculos").doc(vehiculoId);
          const docSnap = await vehiculoRef.get();
          if (docSnap.exists) { // Corregido: .exists es una propiedad
              const vehiculoData = docSnap.data();
              // Eliminar imágenes de Storage
              if (vehiculoData.imagenes && vehiculoData.imagenes.length > 0) {
                  const deletePromises = vehiculoData.imagenes.map(imageUrl => {
                      try {
                          const imageRef = storage.refFromURL(imageUrl);
                          return imageRef.delete().catch(err => {
                              // No detener el proceso si una imagen no se puede borrar (podría ya no existir)
                              console.warn("Advertencia al eliminar imagen de Storage:", err.message, "URL:", imageUrl);
                              return Promise.resolve(); // Continuar con las demás promesas
                          });
                      } catch (e) { 
                          console.warn("Error al crear referencia para borrar imagen (puede ser URL inválida):", e.message, "URL:", imageUrl);
                          return Promise.resolve(); 
                      }
                  });
                  await Promise.all(deletePromises);
              }
              // Eliminar documento de Firestore
              await vehiculoRef.delete();
              alert("Vehículo eliminado con éxito.");
              if (typeof mostrarVehiculos === "function") mostrarVehiculos(); // Refrescar la lista
          } else { 
              alert("Error: El vehículo que intentas eliminar no existe."); 
          }
      } catch (error) { 
          console.error("Error al eliminar vehículo:", error);
          alert("Error al eliminar el vehículo: " + error.message); 
      }
  }

  if (inputImagenesVehiculo && previsualizacionImagenesDiv) {
    inputImagenesVehiculo.addEventListener('change', function(event) {
      previsualizacionImagenesDiv.innerHTML = ''; // Limpiar previsualizaciones anteriores
      const files = event.target.files;
      if (files.length > 5) { 
          alert("Puedes subir un máximo de 5 imágenes."); 
          inputImagenesVehiculo.value = ""; // Limpiar selección
          return; 
      }
      for (const file of files) { 
          if (!file.type.startsWith('image/')){ // Validar tipo de archivo
              alert(`El archivo "${file.name}" no es una imagen válida.`);
              inputImagenesVehiculo.value = ""; // Limpiar selección
              previsualizacionImagenesDiv.innerHTML = '';
              return;
          }
          const reader = new FileReader();
          reader.onload = (e) => {
              const img = document.createElement('img'); 
              img.src = e.target.result;
              // Los estilos se aplican por CSS, pero puedes añadir aquí si es específico
              // img.style.maxWidth = '100px'; img.style.maxHeight = '100px'; img.style.margin = '5px'; img.style.border = '1px solid #444';
              previsualizacionImagenesDiv.appendChild(img);
          }
          reader.readAsDataURL(file);
      }
    });
  }

  if (formIngresoVehiculo) {
    formIngresoVehiculo.addEventListener('submit', async function(event) {
      event.preventDefault();
      const submitButton = formIngresoVehiculo.querySelector('button[type="submit"]');
      if (submitButton.disabled) return; // Evitar doble submit

      submitButton.disabled = true; 
      submitButton.textContent = 'Guardando...';
      
      const patente = document.getElementById('vehiculo-patente').value.trim().toUpperCase();
      const marca = document.getElementById('vehiculo-marca').value.trim();
      const modelo = document.getElementById('vehiculo-modelo').value.trim();
      const ano = document.getElementById('vehiculo-ano').value;
      const clienteNombre = document.getElementById('vehiculo-cliente-nombre').value.trim();
      const clienteTelefono = document.getElementById('vehiculo-cliente-telefono').value.trim();
      const descripcionTrabajo = document.getElementById('vehiculo-descripcion-trabajo').value.trim();
      const files = inputImagenesVehiculo ? inputImagenesVehiculo.files : [];
      let urlsImagenes = [];

      if (!patente || !marca || !modelo || !ano || !descripcionTrabajo) {
          alert("Por favor, complete todos los campos obligatorios (Patente, Marca, Modelo, Año, Descripción).");
          submitButton.disabled = false; submitButton.textContent = 'Guardar Vehículo'; return;
      }
      if (files.length > 5) {
          alert("Puedes subir un máximo de 5 imágenes.");
          submitButton.disabled = false; submitButton.textContent = 'Guardar Vehículo'; return;
      }

      try {
        if (files.length > 0) {
          const uploadPromises = Array.from(files).map(file => {
              if (!file.type.startsWith('image/')) {
                  throw new Error(`El archivo "${file.name}" no es una imagen y no se subirá.`);
              }
              const filePath = `vehiculos/${patente.replace(/[^a-zA-Z0-9]/g, '_')}/${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
              const fileRef = storage.ref().child(filePath);
              return fileRef.put(file).then(snapshot => snapshot.ref.getDownloadURL());
          });
          urlsImagenes = await Promise.all(uploadPromises);
        }
        
        const nuevoVehiculo = {
            patente, 
            marca, 
            modelo, 
            ano: parseInt(ano), 
            clienteNombre, 
            clienteTelefono, 
            descripcionTrabajo, 
            imagenes: urlsImagenes, 
            registradoEl: firebase.firestore.FieldValue.serverTimestamp()
        };
        await db.collection("vehiculos").add(nuevoVehiculo);
        
        alert("¡Vehículo guardado con éxito!");
        formIngresoVehiculo.reset();
        if (previsualizacionImagenesDiv) previsualizacionImagenesDiv.innerHTML = '';
        if (inputImagenesVehiculo) inputImagenesVehiculo.value = ''; // Asegurar que el input file se limpie
        if (typeof mostrarVehiculos === "function") mostrarVehiculos(); 
      } catch (error) { 
          console.error("Error al guardar vehículo:", error);
          alert("Error al guardar vehículo: " + error.message); 
      }
      finally { 
          submitButton.disabled = false; 
          submitButton.textContent = 'Guardar Vehículo'; 
      }
    });
  }
  
  if (formEditarVehiculo) {
      formEditarVehiculo.addEventListener('submit', async function(event) {
          event.preventDefault();
          const vehiculoId = document.getElementById('vehiculo-id-editar').value;
          if (!vehiculoId) { alert("Error: ID de vehículo no encontrado para editar."); return; }
          
          const submitButton = formEditarVehiculo.querySelector('button[type="submit"]');
          if (submitButton.disabled) return;
          submitButton.disabled = true; 
          submitButton.textContent = 'Guardando Cambios...';
          
          const patenteVehiculo = document.getElementById('vehiculo-patente-editar').value.trim().toUpperCase();
          let urlsNuevasImagenes = [];
          const filesParaSubir = inputImagenesEditar ? inputImagenesEditar.files : [];

          try {
              // 1. Subir nuevas imágenes si las hay
              if (filesParaSubir && filesParaSubir.length > 0) {
                  const uploadPromises = Array.from(filesParaSubir).map(file => {
                      if (!file.type.startsWith('image/')) {
                          throw new Error(`El archivo "${file.name}" no es una imagen y no se subirá.`);
                      }
                      const filePath = `vehiculos/${patenteVehiculo.replace(/[^a-zA-Z0-9]/g, '_')}/edit_${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
                      const fileRef = storage.ref().child(filePath);
                      return fileRef.put(file).then(snapshot => snapshot.ref.getDownloadURL());
                  });
                  urlsNuevasImagenes = await Promise.all(uploadPromises);
              }

              // 2. Obtener URLs de imágenes actuales de Firestore
              const vehiculoDocActual = await db.collection("vehiculos").doc(vehiculoId).get();
              let imagenesActualesEnFirestore = (vehiculoDocActual.exists && vehiculoDocActual.data().imagenes) ? vehiculoDocActual.data().imagenes : []; // Corregido

              // 3. Eliminar imágenes de Storage marcadas para borrar
              if (window.imagenesAEliminarDelVehiculo && window.imagenesAEliminarDelVehiculo.length > 0) {
                  const deleteStoragePromises = window.imagenesAEliminarDelVehiculo.map(url => {
                      try {
                          const imageRef = storage.refFromURL(url);
                          return imageRef.delete().catch(err => console.warn("No se pudo borrar de Storage (quizás ya no existe):", url, err));
                      } catch (e) { 
                          console.warn("Error al crear referencia para borrar imagen de Storage:", e.message, "URL:", url);
                          return Promise.resolve(); // Continuar si la URL es inválida
                      }
                  });
                  await Promise.all(deleteStoragePromises);
              }
              
              // 4. Construir el array final de imágenes
              let imagenesFinales = imagenesActualesEnFirestore.filter(url => !(window.imagenesAEliminarDelVehiculo && window.imagenesAEliminarDelVehiculo.includes(url)));
              imagenesFinales = imagenesFinales.concat(urlsNuevasImagenes);
              
              if (imagenesFinales.length > 5) {
                  // Opcional: podrías querer eliminar las más antiguas o las nuevas si se excede.
                  // Por ahora, simplemente truncamos.
                  alert("Se ha excedido el límite de 5 imágenes en total. Se guardarán las primeras 5 de la lista combinada.");
                  imagenesFinales = imagenesFinales.slice(0, 5);
              }

              // 5. Actualizar Firestore
              const datosActualizados = {
                  patente: patenteVehiculo,
                  marca: document.getElementById('vehiculo-marca-editar').value.trim(),
                  modelo: document.getElementById('vehiculo-modelo-editar').value.trim(),
                  ano: parseInt(document.getElementById('vehiculo-ano-editar').value),
                  clienteNombre: document.getElementById('vehiculo-cliente-nombre-editar').value.trim(),
                  clienteTelefono: document.getElementById('vehiculo-cliente-telefono-editar').value.trim(),
                  descripcionTrabajo: document.getElementById('vehiculo-descripcion-trabajo-editar').value.trim(),
                  imagenes: imagenesFinales,
                  actualizadoEl: firebase.firestore.FieldValue.serverTimestamp()
              };

              if (!datosActualizados.patente || !datosActualizados.marca || !datosActualizados.modelo || !datosActualizados.ano) {
                  throw new Error("Patente, Marca, Modelo y Año son obligatorios.");
              }

              await db.collection("vehiculos").doc(vehiculoId).update(datosActualizados);
              alert("¡Vehículo actualizado con éxito!");
              if(modalEditarVehiculo) modalEditarVehiculo.style.display = "none";
              if (typeof mostrarVehiculos === "function") mostrarVehiculos();
          } catch (error) { 
              console.error("Error al actualizar el vehículo:", error);
              alert("Error al actualizar el vehículo: " + error.message); 
          }
          finally {
              submitButton.disabled = false; 
              submitButton.textContent = 'Guardar Cambios';
              window.imagenesAEliminarDelVehiculo = []; // Resetear para la próxima edición
              if (inputImagenesEditar) inputImagenesEditar.value = ''; // Limpiar el input file de edición
              if (previsualizacionImagenesEditarDiv) previsualizacionImagenesEditarDiv.innerHTML = ''; // Limpiar previsualización de nuevos archivos en modal
          }
      });
  }

  // Carga Inicial
  if (typeof mostrarVehiculos === "function") {
      mostrarVehiculos();
  } else {
      console.error("La función mostrarVehiculos no está definida al cargar la página admin_vehiculos.");
  }
});