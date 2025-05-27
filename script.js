
const firebaseConfig = {
  apiKey: "AIzaSyAySrOuWY7Zr7Etq_iFKSFLiWsng3KTkXA",
  authDomain: "edc-automotriz.firebaseapp.com",
  projectId: "edc-automotriz",
  storageBucket: "edc-automotriz.firebasestorage.app",
  messagingSenderId: "387959087823",
  appId: "1:387959087823:web:03469bf7d12f4e78674dba",
  measurementId: "G-K98Q6XWTFT"
};

firebase.initializeApp(firebaseConfig);

const db = firebase.firestore();
const auth = firebase.auth();
const storage = firebase.storage();

document.addEventListener('DOMContentLoaded', function() {
  const btnAbrirPanelLogin = document.getElementById('btn-abrir-modal-login');
  const panelLogin = document.getElementById('panel-login');
  const btnCerrarPanelLogin = document.getElementById('btn-cerrar-panel-login');
  const btnLogin = document.getElementById('btn-login');
  const btnRegister = document.getElementById('btn-register');

  if (btnAbrirPanelLogin) {
    btnAbrirPanelLogin.addEventListener('click', () => {
      panelLogin.style.display = 'block';
      window.scrollTo({ top: panelLogin.offsetTop - 20, behavior: 'smooth' });
    });
  }

  if (btnCerrarPanelLogin) {
    btnCerrarPanelLogin.addEventListener('click', () => {
      panelLogin.style.display = 'none';
    });
  }

  btnLogin.addEventListener('click', () => {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    if (!email || !password) {
      alert("Completa ambos campos.");
      return;
    }
    auth.signInWithEmailAndPassword(email, password)
      .then((userCredential) => {
        alert("¡Inicio de sesión exitoso!");
        panelLogin.style.display = 'none';
        mostrarBotonAdminSiAutenticado();
      })
      .catch((error) => {
        alert("Error al iniciar sesión: " + error.message);
      });
  });

  btnRegister.addEventListener('click', () => {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    if (!email || !password) {
      alert("Completa ambos campos.");
      return;
    }
    auth.createUserWithEmailAndPassword(email, password)
      .then((userCredential) => {
        alert("¡Cuenta creada! Ahora inicia sesión.");
      })
      .catch((error) => {
        alert("Error al registrar: " + error.message);
      });
  });

  function mostrarBotonAdminSiAutenticado() {
    auth.onAuthStateChanged(function(user) {
      const btnPanelAdmin = document.querySelector('.btn-admin[href="admin.html"]');
      if (user) {
        btnPanelAdmin.style.display = 'inline-block';
      } else {
        btnPanelAdmin.style.display = 'none';
      }
    });
  }
  mostrarBotonAdminSiAutenticado();
});
