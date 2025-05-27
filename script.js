const firebaseConfig = {
  apiKey: "AIzaSyAySrOuWY7Zr7Etq_iFKSFLiWsng3KTkXA", //
  authDomain: "edc-automotriz.firebaseapp.com", //
  projectId: "edc-automotriz", //
  storageBucket: "edc-automotriz.firebasestorage.app", //
  messagingSenderId: "387959087823", //
  appId: "1:387959087823:web:03469bf7d12f4e78674dba", //
  measurementId: "G-K98Q6XWTFT" //
};

firebase.initializeApp(firebaseConfig); //

const db = firebase.firestore(); //
const auth = firebase.auth(); //
const storage = firebase.storage(); //

document.addEventListener('DOMContentLoaded', function() {
  const btnAbrirPanelLogin = document.getElementById('btn-abrir-modal-login'); //
  const panelLogin = document.getElementById('panel-login'); //
  const btnCerrarPanelLogin = document.getElementById('btn-cerrar-panel-login'); //
  const btnLogin = document.getElementById('btn-login'); //
  const btnRegister = document.getElementById('btn-register'); //

  // --- INICIO DE PRUEBAS (MODIFICACIÓN) ---
  // Estos logs son útiles para index.html, pero pueden ser 'ruido' en admin.html
  if (window.location.pathname.endsWith('index.html') || window.location.pathname === '/') { // Solo loguear en index.html
    console.log("Botón para abrir panel (index.html):", btnAbrirPanelLogin); //
    console.log("Panel de Login (index.html):", panelLogin); //
  }
  // --- FIN DE PRUEBAS ---

  if (btnAbrirPanelLogin) { // Este if ya previene el error si el botón no existe
    btnAbrirPanelLogin.addEventListener('click', () => { //
      // console.log("¡Clic detectado en btnAbrirPanelLogin!"); // Log útil, pero puede quitarse si funciona
      if (panelLogin) { //
        panelLogin.style.display = 'block'; //
        window.scrollTo({ top: panelLogin.offsetTop - 20, behavior: 'smooth' }); //
      } else {
        // Este error solo debería aparecer si btnAbrirPanelLogin existe pero panelLogin no, lo cual sería raro.
        console.error("Error: panelLogin no fue encontrado al hacer clic (inesperado).");
      }
    });
  } else {
    // En lugar de error, un log informativo si no estamos en index.html
    if (window.location.pathname.endsWith('index.html') || window.location.pathname === '/') {
        console.warn("Advertencia: btnAbrirPanelLogin no fue encontrado en el DOM de index.html."); //
    }
  }

  if (btnCerrarPanelLogin) { //
    btnCerrarPanelLogin.addEventListener('click', () => { //
      if (panelLogin) { //
        panelLogin.style.display = 'none'; //
      } else {
        // console.error("Error: panelLogin no fue encontrado al intentar cerrar."); // Podría ser un warn también
      }
    });
  }

  if (btnLogin) { //
    btnLogin.addEventListener('click', () => { //
      const email = document.getElementById('login-email').value; //
      const password = document.getElementById('login-password').value; //
      if (!email || !password) { //
        alert("Completa ambos campos."); //
        return; //
      }
      auth.signInWithEmailAndPassword(email, password) //
        .then((userCredential) => { //
          alert("¡Inicio de sesión exitoso!"); //
          if (panelLogin) panelLogin.style.display = 'none'; //
          mostrarBotonAdminSiAutenticado(); //
        })
        .catch((error) => { //
          alert("Error al iniciar sesión: " + error.message); //
        });
    });
  }


  if (btnRegister) { //
    btnRegister.addEventListener('click', () => { //
      const email = document.getElementById('login-email').value; //
      const password = document.getElementById('login-password').value; //
      if (!email || !password) { //
        alert("Completa ambos campos."); //
        return; //
      }
      auth.createUserWithEmailAndPassword(email, password) //
        .then((userCredential) => { //
          alert("¡Cuenta creada! Ahora inicia sesión."); //
        })
        .catch((error) => { //
          alert("Error al registrar: " + error.message); //
        });
    });
  }

  function mostrarBotonAdminSiAutenticado() { //
    auth.onAuthStateChanged(function(user) { //
      // Solo intentar manipular este botón si estamos en index.html
      if (window.location.pathname.endsWith('index.html') || window.location.pathname === '/') {
        const btnPanelAdmin = document.querySelector('.btn-admin[href="admin.html"]'); //
        if (btnPanelAdmin) { //
          if (user) { //
            btnPanelAdmin.style.display = 'inline-block'; //
          } else { //
            btnPanelAdmin.style.display = 'none'; //
          }
        } else {
           // console.warn("Advertencia: Botón Panel Admin no encontrado en index.html para mostrar/ocultar."); //
        }
      }
    });
  }
  mostrarBotonAdminSiAutenticado(); //
});


// La "Lógica para presupuestos guardados" que estaba aquí, la hemos movido
// completamente al script de admin.html, ya que es específica de esa página.
// Por lo tanto, esta sección ya no debería estar en script.js si solo es para admin.
// Si la necesitas por alguna otra razón globalmente, entonces la dejas,
// pero asegúrate de que los IDs como 'lista-presupuestos' solo se accedan
// si la página actual los tiene.