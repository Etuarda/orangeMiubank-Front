// src/js/pet.js
import { api } from './api.js';

document.addEventListener('DOMContentLoaded', async () => {
    // Só carrega o pet se estiver na página da dashboard
    if (window.location.pathname.endsWith('index.html') || window.location.pathname === '/') {
        await loadPetData();
    }
});

async function loadPetData() {
    const petImage = document.getElementById('petImage');
    const petMoodText = document.getElementById('petMoodText');
    const petPointsText = document.getElementById('petPointsText');

    if (!petImage || !petMoodText || !petPointsText) {
        console.warn('Elementos do pet não encontrados na página.');
        return;
    }

    try {
        const userProfile = await api.user.getProfile();
        const petData = userProfile.pet; // Seu backend já inclui o pet no profile

        if (petData) {
            let moodImageSrc = 'src/assets/images/cat-neutral.svg'; // Default
            let moodText = 'Neutro';

            // Lógica de humor baseada na pontuação (ou no 'mood' direto do backend, se preferir)
            // Seu schema.prisma tem 'mood' como Int (1 a 5, por exemplo)
            // Se o mood for 1-2: triste, 3: neutro, 4-5: feliz
            if (petData.mood >= 4) {
                moodImageSrc = 'src/assets/images/cat-happy.svg';
                moodText = 'Feliz';
            } else if (petData.mood <= 2) {
                moodImageSrc = 'src/assets/images/cat-sad.svg';
                moodText = 'Triste';
            } else {
                moodImageSrc = 'src/assets/images/cat-neutral.svg';
                moodText = 'Neutro';
            }

            petImage.src = moodImageSrc;
            petMoodText.textContent = `Humor: ${moodText}`;
            petPointsText.textContent = `Pontos: ${userProfile.points}`; // Use a coluna 'points' do User

        } else {
            petMoodText.textContent = 'Pet não disponível.';
            petPointsText.textContent = '';
            petImage.src = 'src/assets/images/cat-neutral.svg'; // Imagem padrão
        }

    } catch (error) {
        console.error('Erro ao carregar dados do pet:', error);
        petMoodText.textContent = 'Erro ao carregar pet.';
        petPointsText.textContent = '';
        petImage.src = 'src/assets/images/cat-neutral.svg';
    }
}