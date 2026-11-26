
export default async (request) => {
  if (request.method !== "POST") {
    return Response.json(
      { error: "Используй POST-запрос" },
      { status: 405 }
    );
  }

  const apiKey = process.env.MISTRAL_API_KEY;

  if (!apiKey) {
    return Response.json(
      { error: "Не найден ключ MISTRAL_API_KEY в Netlify" },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();
    const { action, topic, keyword } = body;

    if (!topic || typeof topic !== "string" || topic.length > 1000) {
      return Response.json(
        { error: "Укажи тему длиной до 1000 символов" },
        { status: 400 }
      );
    }

    const prompts = {
      ideas: `Создай 10 оригинальных идей YouTube Shorts на тему: ${topic}. Для каждой дай цепляющий заголовок, краткую суть и крючок первых 3 секунд.`,

      script: `Напиши полноценный сценарий YouTube Shorts на тему: ${topic}. Структура: крючок, вступление, основная часть, вывод и призыв подписаться. Продолжительность около 60 секунд.`,

      seo: `Подготовь SEO для YouTube-видео на тему: ${topic}. Ключевое слово: ${keyword || topic}. Дай 5 заголовков, описание, хештеги и ключевые слова.`
    };

    if (!prompts[action]) {
      return Response.json(
        { error: "Неизвестный тип запроса" },
        { status: 400 }
      );
    }

    const response = await fetch(
      "https://api.mistral.ai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "mistral-small-latest",
          messages: [
            {
              role: "system",
              content: "Ты профессиональный ИИ-помощник KBR YouTube PRO. Отвечай на русском языке. Создавай качественный, оригинальный и полезный контент."
            },
            {
              role: "user",
              content: prompts[action]
            }
          ],
          temperature: 0.7,
          max_tokens: 1800
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return Response.json(
        { error: data.message || data.detail || "Ошибка Mistral API" },
        { status: response.status }
      );
    }

    return Response.json({
      success: true,
      result: data.choices?.[0]?.message?.content || "ИИ не вернул текст"
    });

  } catch (error) {
    return Response.json(
      { error: error.message || "Ошибка сервера" },
      { status: 500 }
    );
  }
};
