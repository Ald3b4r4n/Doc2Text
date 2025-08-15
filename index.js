// Configuração do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyA-NWBdLBUWErBgqhRFBrfXtHDZhTt7qLA", // Mantenha sua chave
  authDomain: "abordagem-digital.firebaseapp.com",
  projectId: "abordagem-digital",
  storageBucket: "abordagem-digital.appspot.com",
  messagingSenderId: "600761255148",
  appId: "1:600761255148:web:10b455992c70ca42c391c9",
  measurementId: "G-QDHYDYZ044"
};

// Inicializa o Firebase
const app = firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();

// Configuração da Interface de Usuário (UI) do Firebase
const uiConfig = {
  // Redireciona para app.html após login bem-sucedido
  signInSuccessUrl: 'app.html',
  // Provedores de login que vamos usar
  signInOptions: [
    {
      provider: firebase.auth.GoogleAuthProvider.PROVIDER_ID,
      customParameters: {
        // Força a seleção de conta do Google
        prompt: 'select_account'
      }
    }
  ],
  // TODO: Adicionar URLs dos seus termos de serviço e política de privacidade
  tosUrl: '#',
  privacyPolicyUrl: '#',
  // Define o fluxo de login como um popup
  signInFlow: 'popup',
  callbacks: {
    // Esconde o loader quando a UI é exibida
    uiShown: function() {
      document.getElementById('loader').style.display = 'none';
    }
  }
};

// Inicializa a instância da FirebaseUI
const ui = new firebaseui.auth.AuthUI(auth);

// Monitora o estado da autenticação
auth.onAuthStateChanged((user) => {
  if (user) {
    // Se o usuário já estiver logado, redireciona para a página principal
    window.location.href = 'app.html';
  } else {
    // Se não houver usuário, inicia a UI de login e mostra o contêiner
    ui.start('#firebaseui-auth-container', uiConfig);
    document.getElementById('loginContainer').style.display = 'block';
    document.getElementById('loader').style.display = 'block'; // Mostra o loader enquanto a UI carrega
  }
});
