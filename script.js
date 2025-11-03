class LoteriaMexicana {
    constructor() {
        this.cartas = [];
        this.musicas = [];
        this.cartasEmbaralhadas = [];
        this.cartasMostradas = [];
        this.indiceAtual = 0;
        this.intervalo = null;
        this.audioAtual = null;
        this.pausado = false;
        this.tempoExibicao = 8000; // 8 segundos
        this.tempoInicioExibicao = null; // Timestamp de quando a carta atual começou a ser exibida
        this.tempoRestanteAoPausar = null; // Tempo restante quando pausado

        this.initializeElements();
        this.attachEventListeners();
    }

    initializeElements() {
        this.imagensInput = document.getElementById('imagensInput');
        this.musicasInput = document.getElementById('musicasInput');
        this.folderStatus = document.getElementById('folderStatus');
        this.currentCard = document.getElementById('currentCard');
        this.cardTitle = document.getElementById('cardTitle');
        this.historyContainer = document.getElementById('historyContainer');
        this.shownCount = document.getElementById('shownCount');
        this.remainingCount = document.getElementById('remainingCount');
        this.startBtn = document.getElementById('startBtn');
        this.pauseBtn = document.getElementById('pauseBtn');
        this.restartBtn = document.getElementById('restartBtn');
        this.finishBtn = document.getElementById('finishBtn');
    }

    attachEventListeners() {
        this.imagensInput.addEventListener('change', (e) => this.handleImagensSelection(e));
        this.musicasInput.addEventListener('change', (e) => this.handleMusicasSelection(e));
        this.startBtn.addEventListener('click', () => this.iniciar());
        this.pauseBtn.addEventListener('click', () => this.pausar());
        this.restartBtn.addEventListener('click', () => this.reiniciar());
        this.finishBtn.addEventListener('click', () => this.finalizar());
    }

    handleImagensSelection(event) {
        const files = Array.from(event.target.files);
        this.cartas = files.filter(file => this.isImageFile(file));
        
        this.verificarEAtualizarStatus();
        this.prepararCartas();
    }

    handleMusicasSelection(event) {
        const files = Array.from(event.target.files);
        this.musicas = files.filter(file => this.isAudioFile(file));
        
        this.verificarEAtualizarStatus();
    }

    verificarEAtualizarStatus() {
        if (this.cartas.length > 0 && this.musicas.length > 0) {
            this.folderStatus.textContent = `✅ ${this.cartas.length} cartas e ${this.musicas.length} músicas carregadas`;
            this.habilitarBotoes();
        } else if (this.cartas.length > 0) {
            this.folderStatus.textContent = `✅ ${this.cartas.length} cartas carregadas. ${this.musicas.length === 0 ? 'Selecione a pasta de músicas (opcional)' : ''}`;
            this.habilitarBotoes();
        } else if (this.musicas.length > 0) {
            this.folderStatus.textContent = `✅ ${this.musicas.length} músicas carregadas. Selecione a pasta de imagens`;
        } else {
            this.folderStatus.textContent = 'Selecione as pastas com imagens e músicas';
        }
    }

    prepararCartas() {
        if (this.cartas.length > 0) {
            // Embaralhar cartas
            this.cartasEmbaralhadas = [...this.cartas].sort(() => Math.random() - 0.5);
            this.cartasMostradas = [];
            this.indiceAtual = 0;
            this.atualizarContador();
        }
    }

    habilitarBotoes() {
        if (this.cartas.length > 0) {
            this.startBtn.disabled = false;
            this.restartBtn.disabled = false;
            this.finishBtn.disabled = false;
        }
    }

    isImageFile(file) {
        const imageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/bmp'];
        return imageTypes.includes(file.type) || /\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(file.name);
    }

    isAudioFile(file) {
        const audioTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/aac', 'audio/webm'];
        return audioTypes.includes(file.type) || /\.(mp3|wav|ogg|aac|m4a|webm)$/i.test(file.name);
    }

    iniciar() {
        if (this.cartasEmbaralhadas.length === 0) {
            alert('Nenhuma carta disponível!');
            return;
        }

        // Iniciar música se disponível
        if (this.audioAtual === null && this.musicas.length > 0) {
            this.iniciarMusica();
        } else if (this.audioAtual && this.pausado) {
            // Se estava pausado, retomar a música com fade in
            this.resumirMusica();
        }

        if (this.pausado) {
            // Continuar de onde parou respeitando o tempo restante
            this.pausado = false;
            const tempoRestante = this.tempoRestanteAoPausar || this.tempoExibicao;
            this.continuarCartaAtual(tempoRestante);
        } else {
            // Começar do início ou continuar
            this.exibirProximaCarta();
        }

        this.startBtn.disabled = true;
        this.pauseBtn.disabled = false;
    }

    pausar() {
        this.pausado = true;
        
        // Calcular tempo restante antes de parar o timer
        if (this.tempoInicioExibicao) {
            const tempoDecorrido = Date.now() - this.tempoInicioExibicao;
            this.tempoRestanteAoPausar = Math.max(0, this.tempoExibicao - tempoDecorrido);
        } else {
            this.tempoRestanteAoPausar = this.tempoExibicao;
        }
        
        this.pararTimer();
        
        // Pausar música com fade out
        if (this.audioAtual) {
            this.pausarMusica();
        }
        
        this.startBtn.disabled = false;
        this.pauseBtn.disabled = true;
    }

    reiniciar() {
        this.pararTimer();
        this.pararAudio();
        
        // Embaralhar novamente
        this.cartasEmbaralhadas = [...this.cartas].sort(() => Math.random() - 0.5);
        this.cartasMostradas = [];
        this.indiceAtual = 0;
        this.pausado = false;
        this.tempoInicioExibicao = null;
        this.tempoRestanteAoPausar = null;

        // Limpar exibição atual
        this.currentCard.innerHTML = '<p class="placeholder-text">Pronto para reiniciar</p>';
        this.cardTitle.textContent = '';
        this.historyContainer.innerHTML = '<p class="history-empty">Nenhuma carta exibida ainda</p>';

        this.atualizarContador();
        this.startBtn.disabled = false;
        this.pauseBtn.disabled = true;
    }

    finalizar() {
        this.pararTimer();
        this.pararAudio();
        
        this.startBtn.disabled = false;
        this.pauseBtn.disabled = true;
        this.pausado = false;
        this.tempoInicioExibicao = null;
        this.tempoRestanteAoPausar = null;
    }

    exibirProximaCarta() {
        if (this.indiceAtual >= this.cartasEmbaralhadas.length) {
            alert('Todas as cartas foram exibidas!');
            this.finalizar();
            return;
        }

        const carta = this.cartasEmbaralhadas[this.indiceAtual];
        const nomeCarta = this.obterNomeSemExtensao(carta.name);

        // Criar URL do objeto para exibir a imagem
        const imageUrl = URL.createObjectURL(carta);

        // Exibir carta atual com animação de chegada
        this.currentCard.innerHTML = `<img src="${imageUrl}" alt="${nomeCarta}" class="card-arriving">`;
        this.cardTitle.textContent = nomeCarta;

        // Adicionar ao histórico com animação
        this.adicionarAoHistorico(imageUrl, nomeCarta);

        // Incrementar índice
        this.indiceAtual++;
        this.cartasMostradas.push(carta);
        this.atualizarContador();

        // Configurar timer para próxima carta
        this.iniciarTimer();
    }

    continuarCartaAtual(tempoRestante) {
        // Continuar exibindo a carta atual pelo tempo restante
        this.pararTimer();
        this.tempoInicioExibicao = Date.now() - (this.tempoExibicao - tempoRestante);
        
        this.intervalo = setTimeout(() => {
            if (!this.pausado) {
                this.tempoRestanteAoPausar = null;
                this.tempoInicioExibicao = null;
                this.exibirProximaCarta();
            }
        }, tempoRestante);
    }

    iniciarTimer() {
        this.pararTimer();
        this.tempoInicioExibicao = Date.now();
        this.tempoRestanteAoPausar = null;
        
        this.intervalo = setTimeout(() => {
            if (!this.pausado) {
                this.tempoInicioExibicao = null;
                this.exibirProximaCarta();
            }
        }, this.tempoExibicao);
    }

    adicionarAoHistorico(imageUrl, titulo) {
        // Limpar mensagem de histórico vazio
        if (this.historyContainer.querySelector('.history-empty')) {
            this.historyContainer.innerHTML = '';
        }

        // Contar quantas cartas já existem no histórico
        const cartasExistentes = this.historyContainer.querySelectorAll('.history-item').length;
        
        // Criar item de histórico
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item';
        
        const img = document.createElement('img');
        img.src = imageUrl;
        img.alt = titulo;
        
        const title = document.createElement('div');
        title.className = 'history-item-title';
        title.textContent = titulo;
        
        historyItem.appendChild(img);
        historyItem.appendChild(title);
        
        // Aplicar disposição aleatória baseada no índice (3 disposições que se repetem)
        const disposicaoIndex = cartasExistentes % 3;
        historyItem.classList.add(`disposition-${disposicaoIndex}`);
        
        // Adicionar no início do histórico
        this.historyContainer.insertBefore(historyItem, this.historyContainer.firstChild);
        
        // Limpar cartas antigas para liberar memória (manter apenas as últimas 15)
        this.limparCartasAntigas();
    }

    limparCartasAntigas() {
        const todasAsCartas = this.historyContainer.querySelectorAll('.history-item');
        const limiteCartas = 15; // Manter apenas as últimas 15 cartas
        
        if (todasAsCartas.length > limiteCartas) {
            // Remover as cartas mais antigas
            for (let i = limiteCartas; i < todasAsCartas.length; i++) {
                const carta = todasAsCartas[i];
                // Liberar URL da memória antes de remover
                const img = carta.querySelector('img');
                if (img && img.src && img.src.startsWith('blob:')) {
                    URL.revokeObjectURL(img.src);
                }
                carta.remove();
            }
        }
    }

    iniciarMusica() {
        if (this.musicas.length === 0) {
            return;
        }

        // Selecionar música aleatória
        const musicaAleatoria = this.musicas[Math.floor(Math.random() * this.musicas.length)];
        const audioUrl = URL.createObjectURL(musicaAleatoria);

        this.audioAtual = new Audio(audioUrl);
        this.audioAtual.loop = true; // Fazer a música tocar em loop
        this.audioAtual.volume = 0;
        
        this.audioAtual.play().catch(error => {
            console.log('Erro ao reproduzir música:', error);
        });

        // Fade in da música
        this.fadeInMusica();

        // Limpar URL quando for necessário (mas mantém a música tocando)
        this.audioAtual.addEventListener('ended', () => {
            // Se por algum motivo o loop não funcionar, recomeçar
            if (this.audioAtual && !this.pausado) {
                this.audioAtual.currentTime = 0;
                this.audioAtual.play();
            }
        });
    }

    fadeInMusica() {
        if (!this.audioAtual) return;
        
        const fadeDuration = 1000; // 1 segundo para fade in
        const fadeSteps = 20;
        const volumeStep = 1 / fadeSteps;
        const timeStep = fadeDuration / fadeSteps;
        let currentStep = 0;

        const fadeInterval = setInterval(() => {
            if (!this.audioAtual || this.pausado) {
                clearInterval(fadeInterval);
                return;
            }

            currentStep++;
            this.audioAtual.volume = Math.min(1, currentStep * volumeStep);

            if (currentStep >= fadeSteps) {
                this.audioAtual.volume = 1;
                clearInterval(fadeInterval);
            }
        }, timeStep);
    }

    pausarMusica() {
        if (!this.audioAtual) return;
        
        const fadeDuration = 500; // 0.5 segundo para fade out
        const fadeSteps = 10;
        const volumeStep = this.audioAtual.volume / fadeSteps;
        const timeStep = fadeDuration / fadeSteps;
        let currentVolume = this.audioAtual.volume;
        let currentStep = 0;

        const fadeInterval = setInterval(() => {
            if (!this.audioAtual) {
                clearInterval(fadeInterval);
                return;
            }

            currentStep++;
            currentVolume = Math.max(0, currentVolume - volumeStep);
            this.audioAtual.volume = currentVolume;

            if (currentStep >= fadeSteps || currentVolume <= 0) {
                this.audioAtual.volume = 0;
                this.audioAtual.pause();
                clearInterval(fadeInterval);
            }
        }, timeStep);
    }

    resumirMusica() {
        if (!this.audioAtual) return;
        
        this.audioAtual.volume = 0;
        this.audioAtual.play().catch(error => {
            console.log('Erro ao retomar música:', error);
        });
        
        // Fade in da música
        this.fadeInMusica();
    }

    pararTimer() {
        if (this.intervalo) {
            clearTimeout(this.intervalo);
            this.intervalo = null;
        }
    }

    pararAudio() {
        if (this.audioAtual) {
            this.audioAtual.pause();
            this.audioAtual.currentTime = 0;
            this.audioAtual = null;
        }
    }

    atualizarContador() {
        const mostradas = this.cartasMostradas.length;
        const restantes = Math.max(0, this.cartasEmbaralhadas.length - this.indiceAtual);
        
        this.shownCount.textContent = mostradas;
        this.remainingCount.textContent = restantes;
    }

    obterNomeSemExtensao(nomeArquivo) {
        return nomeArquivo.replace(/\.[^/.]+$/, '');
    }
}

// Inicializar aplicação quando a página carregar
document.addEventListener('DOMContentLoaded', () => {
    new LoteriaMexicana();
});
