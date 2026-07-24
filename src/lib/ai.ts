import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '키_없음');

export async function generateFactBomb(githubData: any) {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const prompt = `
      너는 개발자의 GitHub 데이터를 분석해 고전 RPG 게임의 캐릭터 스탯을 부여하는 게임 마스터야.
      다음 데이터를 분석해서 반드시 JSON 형식으로만 응답해. 마크다운 기호(\`\`\`json)는 절대 쓰지 마.
      
      [분석할 데이터]
      커밋 수: ${githubData.commitCount}
      레포지토리 수: ${githubData.repoCount}
      주력 언어: ${githubData.mainLanguages.join(', ')}

      [JSON 출력 규격]
      {
        "class": "예: 고립된 마이크로서비스의 망령",
        "hp": 1000에서 9999 사이,
        "attack": 10에서 999 사이,
        "defense": 10에서 999 사이,
        "evasion": 10에서 99 사이,
        "items": [
          { "slot": "무기", "name": "주력 언어를 활용한 무기 이름", "rarity": "Legendary" },
          { "slot": "투구", "name": "프레임워크나 툴을 활용한 방어구", "rarity": "Rare" },
          { "slot": "장신구", "name": "재치있는 개발 관련 아이템", "rarity": "Epic" }
        ],
        "factBomb": "개발 습관에 대한 사이버펑크 스타일의 뼈때리는 팩폭 2문장"
      }
    `;

    const result = await model.generateContent(prompt);
    const text = (await result.response.text()).replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(text); 
  } catch (error) {
    console.error('Gemini API 호출 실패:', error);
    return {
      class: "초보 모험가", hp: 100, attack: 10, defense: 10, evasion: 5,
      items: [{ slot: "무기", name: "낡은 나무 키보드", rarity: "Normal" }],
      factBomb: "API 키를 찾을 수 없어 기본 지급 장비만 제공합니다."
    };
  }
}