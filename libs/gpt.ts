import axios from 'axios';

// Define interface for chat message
interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

// Use this if you want to make a call to OpenAI GPT-4 for instance. userId is used to identify the user on openAI side.
export const sendOpenAi = async (
  messages: ChatMessage[],
  userId: number,
  max = 100,
  temp = 1
) => {
  const url = 'https://api.openai.com/v1/chat/completions';

  console.log('Ask GPT >>>');
  messages.map((m) =>
    console.log(' - ' + m.role.toUpperCase() + ': ' + m.content)
  );

  const body = JSON.stringify({
    model: 'gpt-4',
    messages,
    max_tokens: max,
    temperature: temp,
    user: userId,
  });

  const options = {
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
  };

  try {
    const res = await axios.post(url, body, options);

    const answer = res.data.choices[0].message.content;
    const usage = res?.data?.usage;

    console.log('>>> ' + answer);
    console.log(
      'TOKENS USED: ' +
        usage?.total_tokens +
        ' (prompt: ' +
        usage?.prompt_tokens +
        ' / response: ' +
        usage?.completion_tokens +
        ')'
    );
    console.log('\n');

    return answer;
  } catch (e: unknown) {
    // Safely handle error with proper type checking
    if (e && typeof e === 'object' && 'response' in e) {
      const errorObj = e as { response?: { status?: number; data?: any } };
      console.error('GPT Error: ' + errorObj.response?.status, errorObj.response?.data);
    } else {
      console.error('GPT Error:', e);
    }
    return null;
  }
};
