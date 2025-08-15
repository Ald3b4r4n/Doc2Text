// Aguarda o carregamento completo do DOM antes de executar o resto do código
document.addEventListener("DOMContentLoaded", function () {
  // =============================================
  // CONSTANTES DE CONFIGURAÇÃO
  // =============================================
  const MAX_FILE_SIZE_KB = 1024;
  const MAX_DIMENSION = 1200;
  const OCR_API_KEY = "K82112819888957";
  const OCR_TIMEOUT = 30000;

  // =============================================
  // INICIALIZAÇÃO E AUTENTICAÇÃO FIREBASE
  // =============================================
  const firebaseConfig = {
    apiKey: "AIzaSyA-NWBdLBUWErBgqhRFBrfXtHDZhTt7qLA",
    authDomain: "abordagem-digital.firebaseapp.com",
    projectId: "abordagem-digital",
    storageBucket: "abordagem-digital.appspot.com",
    messagingSenderId: "600761255148",
    appId: "1:600761255148:web:10b455992c70ca42c391c9",
    measurementId: "G-QDHYDYZ044",
  };

  // Inicializa o Firebase e a Autenticação
  const fbApp = firebase.initializeApp(firebaseConfig);
  const fbAuth = firebase.auth();

  // Guarda de Autenticação - Protege a página
  fbAuth.onAuthStateChanged((user) => {
    if (user) {
      // Usuário está logado. Exibe suas informações.
      const userInfo = document.getElementById("userInfo");
      if (userInfo) {
        userInfo.textContent = user.email;
      }
    } else {
      // Usuário não está logado. Redireciona para a página de login.
      window.location.href = "login.html";
    }
  });

  // Lógica de Logout
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      fbAuth
        .signOut()
        .then(() => {
          window.location.href = "login.html";
        })
        .catch((error) => {
          console.error("Erro ao fazer logout:", error);
        });
    });
  }

  // =============================================
  // ESTADO DA APLICAÇÃO
  // =============================================
  let currentFile = null;
  let ocrRawText = "";
  let currentCorrectionField = "";

  // =============================================
  // CACHE DE ELEMENTOS DOM
  // =============================================
  const elements = {
    fileInput: document.getElementById("fileInput"),
    cameraBtn: document.getElementById("cameraBtn"),
    galleryBtn: document.getElementById("galleryBtn"),
    preview: document.getElementById("preview"),
    previewSection: document.getElementById("previewSection"),
    processBtn: document.getElementById("processBtn"),
    fileSizeAlert: document.getElementById("fileSizeAlert"),
    sizeWarningText: document.getElementById("sizeWarningText"),
    compressProgress: document.getElementById("compressProgress"),
    progressBar: document.getElementById("progressBar"),
    fullText: document.getElementById("fullText"),
    copyBtn: document.getElementById("copyBtn"),
    whatsappBtn: document.getElementById("whatsappBtn"),
    resetAntecedentes: document.getElementById("resetAntecedentes"),
    resetLocal: document.getElementById("resetLocal"),
    resetEquipe: document.getElementById("resetEquipe"),
    abordado: document.getElementById("abordado"),
    genitora: document.getElementById("genitora"),
    apelido: document.getElementById("apelido"),
    cpf: document.getElementById("cpf"),
    dn: document.getElementById("dn"),
    antecedentes: document.getElementById("antecedentes"),
    endereco: document.getElementById("endereco"),
    local: document.getElementById("local"),
    equipe: document.getElementById("equipe"),
    tornozeleiraCheck: document.getElementById("tornozeleiraCheck"),
    naoAplicaTornozeleira: document.getElementById("naoAplicaTornozeleira"),
    tornozeleiraNumero: document.getElementById("tornozeleiraNumero"),
    veiculoCheck: document.getElementById("veiculoCheck"),
    naoAplicaVeiculo: document.getElementById("naoAplicaVeiculo"),
    veiculoPlaca: document.getElementById("veiculoPlaca"),
    veiculoCor: document.getElementById("veiculoCor"),
    veiculoModelo: document.getElementById("veiculoModelo"),
    inserirApelido: document.getElementById("inserirApelido"),
    naoAplicaApelido: document.getElementById("naoAplicaApelido"),
    correctionModal: new bootstrap.Modal(
      document.getElementById("correctionModal")
    ),
    modalFieldName: document.getElementById("modalFieldName"),
    ocrTextContent: document.getElementById("ocrTextContent"),
    startExpression: document.getElementById("startExpression"),
    endExpression: document.getElementById("endExpression"),
    resultPreview: document.getElementById("resultPreview"),
    manualInput: document.getElementById("manualInput"),
    applyCorrection: document.getElementById("applyCorrection"),
    cameraBtnAbordado: document.getElementById("cameraBtnAbordado"),
    galleryBtnAbordado: document.getElementById("galleryBtnAbordado"),
    fileInputAbordado: document.getElementById("fileInputAbordado"),
    previewAbordado: document.getElementById("previewAbordado"),
    previewSectionAbordado: document.getElementById("previewSectionAbordado"),
  };

  const requiredFields = [
    "abordado",
    "genitora",
    "cpf",
    "dn",
    "antecedentes",
    "endereco",
    "local",
    "equipe",
  ];

  // =============================================
  // CONFIGURAÇÃO DE EVENT LISTENERS
  // =============================================

  elements.cameraBtn.addEventListener("click", () =>
    openFileSelector(elements.fileInput, "environment")
  );
  elements.galleryBtn.addEventListener("click", () =>
    openFileSelector(elements.fileInput)
  );
  elements.fileInput.addEventListener("change", handleFileSelect);

  elements.cameraBtnAbordado.addEventListener("click", () =>
    openFileSelector(elements.fileInputAbordado, "environment")
  );
  elements.galleryBtnAbordado.addEventListener("click", () =>
    openFileSelector(elements.fileInputAbordado)
  );
  elements.fileInputAbordado.addEventListener(
    "change",
    handleFileSelectAbordado
  );

  elements.processBtn.addEventListener("click", processDocument);
  elements.copyBtn.addEventListener("click", copyToClipboard);
  elements.whatsappBtn.addEventListener("click", sendToWhatsApp);

  elements.resetAntecedentes.addEventListener("click", () =>
    clearField("antecedentes")
  );
  elements.resetLocal.addEventListener("click", () => clearField("local"));
  elements.resetEquipe.addEventListener("click", () => clearField("equipe"));

  document.querySelectorAll(".edit-btn").forEach((btn) => {
    btn.addEventListener("click", function () {
      const fieldId = this.getAttribute("data-field");
      openCorrectionModal(fieldId);
    });
  });

  elements.applyCorrection.addEventListener("click", applyCorrectionValue);
  elements.startExpression.addEventListener("input", updateResultPreview);
  elements.endExpression.addEventListener("input", updateResultPreview);

  requiredFields.forEach((id) => {
    elements[id].addEventListener("input", validateFormAndToggleActions);
  });

  // =============================================
  // LÓGICA DE CHECKBOXES PARES (SIM/NÃO SE APLICA)
  // =============================================

  function setupCheckboxPair(
    checkId,
    naoAplicaId,
    conditionalElementId,
    isInput,
    onCheckCallback = null
  ) {
    const check = document.getElementById(checkId);
    const naoAplica = document.getElementById(naoAplicaId);
    const conditionalElement = document.getElementById(conditionalElementId);

    const updateState = () => {
      const shouldShow = check.checked;
      if (conditionalElement) {
        if (isInput) {
          conditionalElement.disabled = !shouldShow;
          if (!shouldShow) conditionalElement.value = "";
        } else {
          conditionalElement.style.display = shouldShow ? "block" : "none";
        }
      }
    };

    check.addEventListener("change", () => {
      if (check.checked) {
        naoAplica.checked = false;
        if (onCheckCallback) onCheckCallback();
      } else {
        naoAplica.checked = true;
      }
      updateState();
    });

    naoAplica.addEventListener("change", () => {
      if (naoAplica.checked) check.checked = false;
      else check.checked = true;
      updateState();
    });

    // Estado inicial
    naoAplica.checked = true;
    check.checked = false;
    updateState();
  }

  const extractAndFillPlate = () => {
    if (ocrRawText) {
      const plateRegex = /([A-Z]{3}[- ]?\d{4}|[A-Z]{3}\d[A-Z]\d{2})/i;
      const match = ocrRawText.match(plateRegex);
      if (match && match[1]) {
        elements.veiculoPlaca.value = match[1]
          .toUpperCase()
          .trim()
          .replace(" ", "-");
      }
    }
  };

  setupCheckboxPair("inserirApelido", "naoAplicaApelido", "apelido", true);
  setupCheckboxPair(
    "tornozeleiraCheck",
    "naoAplicaTornozeleira",
    "tornozeleiraField",
    false
  );
  setupCheckboxPair(
    "veiculoCheck",
    "naoAplicaVeiculo",
    "veiculoFields",
    false,
    extractAndFillPlate
  );

  // =============================================
  // FUNÇÕES PRINCIPAIS
  // =============================================

  function validateFormAndToggleActions() {
    const isFormValid = requiredFields.every(
      (id) => elements[id].value.trim() !== ""
    );
    elements.copyBtn.disabled = !isFormValid;
    elements.whatsappBtn.disabled = !isFormValid;
  }

  function openFileSelector(inputElement, captureMode) {
    if (captureMode) {
      inputElement.setAttribute("capture", captureMode);
    } else {
      inputElement.removeAttribute("capture");
    }
    inputElement.click();
  }

  function handleFileSelect(e) {
    const file = e.target.files[0];
    if (!file) return;
    currentFile = file;

    const reader = new FileReader();
    reader.onload = function (ev) {
      elements.preview.src = ev.target.result;
      elements.previewSection.classList.remove("d-none");
      elements.processBtn.disabled = false;
      showAlert(
        `Imagem selecionada: ${(file.size / 1024 / 1024).toFixed(
          2
        )}MB. Clique em "Processar".`,
        "info"
      );
    };
    reader.onerror = () => showAlert("Erro ao carregar imagem.", "danger");
    reader.readAsDataURL(file);
  }

  function handleFileSelectAbordado(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function (ev) {
      elements.previewAbordado.src = ev.target.result;
      elements.previewSectionAbordado.classList.remove("d-none");
    };
    reader.onerror = () =>
      showAlert("Erro ao carregar imagem do abordado.", "danger");
    reader.readAsDataURL(file);
  }

  async function processDocument() {
    if (!currentFile) {
      showAlert("Nenhum arquivo selecionado.", "danger");
      return;
    }

    toggleProcessing(true);
    try {
      const processedFile = await processImageFile(currentFile);
      const base64Image = await fileToBase64(processedFile);

      const text = await callOcrSpaceApi(base64Image);

      showAlert("Documento processado com sucesso!", "success");
      ocrRawText = text;
      elements.fullText.value = text;

      await extractAndFillFields(text);

      document
        .querySelectorAll(".edit-btn")
        .forEach((el) => (el.style.visibility = "visible"));
      validateFormAndToggleActions();
    } catch (error) {
      console.error("Erro no processamento:", error);
      const errorMessage = error.message.includes("Tempo excedido")
        ? "Processamento demorou muito. Tente com uma imagem mais nítida ou verifique sua conexão."
        : `Erro no processamento: ${error.message}. Tente outra imagem.`;
      showAlert(errorMessage, "danger");
    } finally {
      toggleProcessing(false);
    }
  }

  async function callOcrSpaceApi(base64Image) {
    const maxRetries = 3; // Máximo de tentativas
    let lastError = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await new Promise(async (resolve, reject) => {
          const timeoutId = setTimeout(
            () => reject(new Error("Tempo excedido no OCR")),
            OCR_TIMEOUT
          );

          try {
            const formData = new FormData();
            formData.append(
              "base64Image",
              `data:image/jpeg;base64,${base64Image}`
            );
            formData.append("language", "por");
            formData.append("OCREngine", "2");

            const response = await fetch("https://api.ocr.space/parse/image", {
              method: "POST",
              headers: { apikey: OCR_API_KEY },
              body: formData,
            });

            clearTimeout(timeoutId);
            if (!response.ok)
              throw new Error(`Erro de rede: ${response.status}`);

            const data = await response.json();
            if (data.IsErroredOnProcessing)
              throw new Error(data.ErrorMessage[0] || "Erro na API de OCR");
            if (!data.ParsedResults || data.ParsedResults.length === 0)
              throw new Error("Nenhum texto foi reconhecido");

            resolve(data.ParsedResults[0].ParsedText || "");
          } catch (error) {
            clearTimeout(timeoutId);
            reject(error);
          }
        });
      } catch (error) {
        lastError = error;
        console.warn(`Tentativa ${attempt} falhou: ${error.message}`);

        // Mostra alerta de tentativa
        showAlert(
          `Tentativa ${attempt} de processamento falhou. Tentando novamente...`,
          "warning"
        );

        // Aguarda antes da próxima tentativa
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }

    throw lastError;
  }

  async function processImageFile(file) {
    if (file.size / 1024 <= MAX_FILE_SIZE_KB) return file;

    showAlert(`Otimizando imagem...`, "warning");
    elements.compressProgress.classList.remove("d-none");

    try {
      updateProgress(30, "Redimensionando...");
      const resizedImage = await resizeImage(
        file,
        MAX_DIMENSION,
        MAX_DIMENSION
      );

      updateProgress(60, "Comprimindo...");
      const compressedImage = await compressToFileSize(
        resizedImage,
        MAX_FILE_SIZE_KB
      );

      updateProgress(100, "Finalizando...");
      await new Promise((resolve) => setTimeout(resolve, 500));
      return compressedImage;
    } catch (error) {
      console.error("Erro ao otimizar imagem:", error);
      throw new Error("Falha na otimização da imagem.");
    } finally {
      setTimeout(() => {
        elements.compressProgress.classList.add("d-none");
        elements.progressBar.style.width = "0%";
      }, 1000);
    }
  }

  // =============================================
  // FUNÇÕES DE EXTRAÇÃO E UTILITÁRIOS
  // =============================================

  function extractAndFillFields(text) {
    const findValue = (regex, group = 1) => {
      const match = text.match(regex);
      return match && match[group] ? match[group].trim() : "";
    };

    elements.abordado.value = findValue(
      /(?:nome|portador)[\s:]*([A-ZÀ-Ü\s]{8,})/i
    );
    elements.genitora.value = findValue(
      /(?:mãe|genitora)[\s:]*([A-ZÀ-Ü\s]{8,})/i
    );
    elements.dn.value = findValue(
      /(?:nasc|nascimento)[\s:.]*(\d{2}\/\d{2}\/\d{4})/i
    );
    elements.cpf.value = findValue(/(\d{3}\.\d{3}\.\d{3}-\d{2})/);
    elements.endereco.value = findValue(/(?:Endereço|ENDERECO)[\s:]*([^\n]+)/i);
  }

  function generateReportText() {
    const getVal = (elId) => elements[elId].value.trim() || "Não informado";

    let apelidoFinal = getVal("apelido");
    if (elements.naoAplicaApelido.checked) {
      apelidoFinal = "Não se aplica";
    }

    let report = `🚨 *ABORDAGEM POLICIAL* 🚨\n\n`;
    report += `*Abordado:* ${getVal("abordado")}\n`;
    report += `*Genitora:* ${getVal("genitora")}\n`;
    report += `*Apelido:* ${apelidoFinal}\n`;
    report += `*CPF:* ${getVal("cpf")}\n`;
    report += `*Data Nasc.:* ${getVal("dn")}\n`;
    report += `*Endereço:* ${getVal("endereco")}\n\n`;
    report += `*Antecedentes:* ${getVal("antecedentes")}\n\n`;
    report += `*Local da Abordagem:* ${getVal("local")}\n`;
    report += `*Equipe:* ${getVal("equipe")}\n\n`;
    report += `*OBSERVAÇÕES:*\n`;

    if (elements.tornozeleiraCheck.checked) {
      report += `- Possui tornozeleira. Número: ${getVal(
        "tornozeleiraNumero"
      )}\n`;
    } else {
      report += `- Tornozeleira: Não se aplica.\n`;
    }

    if (elements.veiculoCheck.checked) {
      report += `- Está de veículo:\n`;
      report += `Placa: ${getVal("veiculoPlaca")}\n`;
      report += `Cor: ${getVal("veiculoCor")}\n`;
      report += `Modelo: ${getVal("veiculoModelo")}\n`;
    } else {
      report += `- Veículo: Não se aplica.\n`;
    }

    return report;
  }

  async function copyToClipboard() {
    const textToCopy = generateReportText();
    try {
      await navigator.clipboard.writeText(textToCopy);
      showAlert("Dados copiados para a área de transferência!", "success");
    } catch (err) {
      console.error("Falha ao copiar:", err);
      showAlert(
        "Erro ao copiar. Seu navegador pode não suportar esta função.",
        "danger"
      );
    }
  }

  async function sendToWhatsApp() {
    const text = generateReportText();
    const abordadoFile = elements.fileInputAbordado.files[0];

    if (navigator.share && abordadoFile && window.isSecureContext) {
      try {
        await navigator.share({
          text: text,
          files: [abordadoFile],
          title: "Relatório de Abordagem",
        });
      } catch (error) {
        if (error.name !== "AbortError") {
          console.error("Erro ao compartilhar:", error);
          showAlert(
            "Não foi possível compartilhar a imagem. Enviando apenas o texto.",
            "warning"
          );
          const encodedText = encodeURIComponent(text);
          window.open(`https://wa.me/?text=${encodedText}`, "_blank");
        }
      }
    } else {
      if (!window.isSecureContext && abordadoFile) {
        alert(
          "ERRO DE SEGURANÇA: O compartilhamento de arquivos só funciona em conexão segura (HTTPS)."
        );
      }
      const encodedText = encodeURIComponent(text);
      window.open(`https://wa.me/?text=${encodedText}`, "_blank");
    }
  }

  // =============================================
  // FUNÇÕES DO MODAL DE CORREÇÃO
  // =============================================

  function openCorrectionModal(fieldId) {
    currentCorrectionField = fieldId;
    elements.modalFieldName.textContent =
      document.querySelector(`label[for="${fieldId}"]`)?.textContent || fieldId;
    elements.ocrTextContent.textContent =
      ocrRawText || "Nenhum texto OCR para exibir.";
    [
      "startExpression",
      "endExpression",
      "resultPreview",
      "manualInput",
    ].forEach((id) => (elements[id].value = ""));
    elements.correctionModal.show();
  }

  function updateResultPreview() {
    const start = elements.startExpression.value;
    const end = elements.endExpression.value;
    if (!start && !end) {
      elements.resultPreview.value = "";
      return;
    }

    let text = ocrRawText;
    let textLower = text.toLowerCase();
    let startIndex = 0;

    if (start) {
      const pos = textLower.indexOf(start.toLowerCase());
      if (pos !== -1) {
        startIndex = pos;
      }
    }

    let endIndex = text.length;
    if (end) {
      const pos = textLower.indexOf(end.toLowerCase(), startIndex);
      if (pos !== -1) {
        endIndex = pos + end.length;
      }
    }

    elements.resultPreview.value = text.substring(startIndex, endIndex).trim();
  }

  function applyCorrectionValue() {
    const val = elements.manualInput.value || elements.resultPreview.value;
    if (val && elements[currentCorrectionField]) {
      elements[currentCorrectionField].value = val;
      validateFormAndToggleActions();
    }
    elements.correctionModal.hide();
  }

  // =============================================
  // FUNÇÕES AUXILIARES
  // =============================================

  function clearField(fieldId) {
    const field = document.getElementById(fieldId);
    if (field) {
      field.value = "";
    }
    validateFormAndToggleActions();
  }

  function toggleProcessing(isProcessing) {
    elements.processBtn.disabled = isProcessing;
    elements.processBtn.innerHTML = isProcessing
      ? '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Processando...'
      : '<i class="bi bi-gear"></i> Processar Documento';
  }

  function showAlert(message, type = "info") {
    elements.fileSizeAlert.className = `alert alert-${type} alert-dismissible fade show`;
    elements.sizeWarningText.textContent = message;
    elements.fileSizeAlert.classList.remove("d-none");

    const isPersistent = type === "danger" || type === "warning";
    if (!isPersistent) {
      setTimeout(() => elements.fileSizeAlert.classList.add("d-none"), 5000);
    }
  }

  function updateProgress(percent, message = "") {
    elements.progressBar.style.width = `${percent}%`;
    if (message) elements.sizeWarningText.textContent = message;
  }

  function fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result.split(",")[1]);
      reader.onerror = (error) =>
        reject(new Error("Falha ao converter arquivo para Base64: " + error));
      reader.readAsDataURL(file);
    });
  }

  // =============================================
  // FUNÇÕES DE PROCESSAMENTO DE IMAGEM
  // =============================================

  async function resizeImage(file, maxWidth, maxHeight) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;

        if (width > height) {
          if (width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width *= maxHeight / height;
            height = maxHeight;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob)
              return reject(
                new Error("Falha ao criar blob da imagem redimensionada")
              );
            resolve(
              new File([blob], file.name, {
                type: "image/jpeg",
                lastModified: Date.now(),
              })
            );
          },
          "image/jpeg",
          0.9
        );
      };
      img.onerror = () =>
        reject(new Error("Falha ao carregar imagem para redimensionamento"));
      img.src = URL.createObjectURL(file);
    });
  }

  async function compressToFileSize(file, maxSizeKB) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);

          let quality = 0.9;
          const compress = () => {
            canvas.toBlob(
              (blob) => {
                if (blob.size / 1024 <= maxSizeKB || quality <= 0.1) {
                  resolve(
                    new File([blob], file.name, {
                      type: "image/jpeg",
                      lastModified: Date.now(),
                    })
                  );
                } else {
                  quality -= 0.1;
                  compress();
                }
              },
              "image/jpeg",
              quality
            );
          };
          compress();
        };
        img.src = event.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  // Validação inicial do formulário
  validateFormAndToggleActions();
});
