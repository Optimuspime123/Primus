//forgive any and all shitcode
addEventListener('fetch', (event) => {
 event.respondWith(handleRequest(event.request));
 //event.respondWith(new Response('OK')); //ignore everything
});
const conversationHistory = {};
const Systemprompt = {};

let lastUpdateId = 0;
async function handleRequest(request) { 
 try {
   const { message, chatId, businessConnectionId, senderId } = await parseTelegramRequest(request);
   if (message && message.text) {
     if (businessConnectionId) {
       // Handle business messages
       if (message.text.startsWith('/ask')) {
       await sendTelegramChatAction(chatId, businessConnectionId, 'typing');
       const text = message.text.slice(4).trim();
       
       
       if (!conversationHistory[senderId]) {
         conversationHistory[senderId] = []; // Initialize empty history
       }
     
       // Get the current conversation history for this user
       const history = conversationHistory[senderId];
     
       // Check if the conversation history exceeds 20000 characters
       const historyLength = history.reduce(
         (sum, msg) => sum + msg.content.length,
         0
       );
     
       if (historyLength > 20000) {
         conversationHistory[senderId] = []; // Clear the history for this user
       }
     
       history.push({ role: "user", content: text });
      
       const systemPrompt = Systemprompt[senderId] || "You are a friendly assistant. Available commands for this chat can be received by user on sending 'help'. ";
       const response = await queryGroq([...history], systemPrompt);

       // Add the assistant's response to the history
       history.push({ role: "assistant", content: response });
       await sendTelegramMessage(chatId, businessConnectionId, response);
     } else if (message.text.toLowerCase() === '/clear') {
       delete conversationHistory[senderId];
       delete Systemprompt[senderId];
       await sendTelegramMessage(chatId, businessConnectionId, 'Conversation history and system prompt cleared.');
     } else if (message.text.startsWith('/test')||message.text.toLowerCase() === 'help' || 
     message.text.toLowerCase() === 'hi' || 
     message.text.toLowerCase() === 'hello' || 
     message.text.toLowerCase() === 'test') {
       const messageDetails = JSON.stringify(message, null, 2);
       const response = `Hi, the business bot is active in this chat :) Send:

/ask {query} - to get a response from an Llama-3-70b model. (with context support!)\n
/quote - to get a random quote.\n
/img or "image" (or /img protect) - to get a random image from the NASA image gallery.\n
/sticker or "sticker" (or /sticker protect) - to get a random sticker.\n
/random or "random" (or /random protect) - to get a random animated emoji. \n
/gen {prompt} or "generate... {prompt}" - Generate an image using AI!\n
/wiki {query} - Summarise a Wikipedia article..\n
\`\`\` /url - /url [message text] [photoUrl] \n button_text - button_url \`\`\` \n
/set {system prompt} - Can be used on @thebotthatsucks_bot to set user's custom system prompt.
Message Details:
\`\`\`json
${messageDetails}
\`\`\``;
       await sendTelegramMessage(chatId, businessConnectionId, response);
     } else if (message.text.startsWith('/correct')) {
       await sendTelegramChatAction(chatId, businessConnectionId, 'typing');
       const text = message.text.slice(8).trim(); 
       const response = await queryGrammarly(text);
       await sendTelegramMessage(chatId, businessConnectionId, response);
     } else if (message.text.startsWith('/cat')) {
        await sendTelegramChatAction(chatId, businessConnectionId, 'typing');
        const fact = await getCatFact();
        await sendTelegramMessage(chatId, businessConnectionId, fact);
       }
       else if (message.text.startsWith('/quote')) {
       await sendTelegramChatAction(chatId, businessConnectionId, 'typing');
       const response = await getQuote();
       await sendTelegramMessage(chatId, businessConnectionId, response);
     }
     else if (message.text.startsWith('/img') || message.text.toLowerCase() === 'image') {
       await sendTelegramChatAction(chatId, businessConnectionId, 'upload_photo');
       const protectContent = message.text.toLowerCase().includes('protect');
       const response = await getNasaImage();
       if (response) {
         if (response.media_type === 'video') {
           await sendTelegramPhoto(chatId, businessConnectionId, response.thumbnail_url, response.title, protectContent);
         } else {
           await sendTelegramPhoto(chatId, businessConnectionId, response.hdurl, response.title, protectContent);
         }
       } else {
         await sendTelegramMessage(chatId, businessConnectionId, 'Error fetching NASA image.');
       }
     }  else if (message.text.startsWith('/sticker') || message.text.toLowerCase() === 'sticker') {
       const protectContent = message.text.toLowerCase().includes('protect');
       const stickerUrl = await getRandomStickerUrl();
       await sendTelegramSticker(chatId, businessConnectionId, stickerUrl, protectContent); 
     }
     else if (message.text.startsWith('/gen') || message.text.toLowerCase().startsWith('gen')) {
       const prompt = message.text.startsWith('/gen') ? message.text.slice(4).trim() : message.text.trim();
       await generateImage(prompt, chatId, businessConnectionId, senderId);
     }
     else if (message.text.startsWith('/random') || message.text.toLowerCase() === 'random') {
       const protectContent = message.text.toLowerCase().includes('protect');
       await sendTelegramDice(chatId, businessConnectionId, protectContent);
     }
     else if (message.text.startsWith('/url')) {
       await sendTelegramChatAction(chatId, businessConnectionId, 'typing');
       const text = message.text.slice(4).trim();
       const lines = text.split('\n');
       
       const messageTextMatch = text.match(/\[(.*?)\]/);
       const messageText = messageTextMatch ? messageTextMatch[1].trim() : '';
       
       const photoUrlMatch = text.match(/\[(.*?)\]/g);
       const photoUrl = photoUrlMatch && photoUrlMatch.length > 1 ? photoUrlMatch[1].slice(1, -1).trim() : '';
       
       const buttonList = lines.slice(1).filter(line => !line.startsWith('['));
       
       const inlineKeyboard = [];
       let hasValidButtons = false;
       
       buttonList.forEach(button => {
         const [buttonText, url] = button.split(' - ');
         if (buttonText && url) {
           inlineKeyboard.push([{ text: buttonText.trim(), url: url.trim() }]);
           hasValidButtons = true; 
         }
       });
       
       if (messageText) {
         if (photoUrl.startsWith('http') || photoUrl.startsWith('https')) {
           await sendTelegramPhoto(chatId, businessConnectionId, photoUrl, messageText, false, hasValidButtons ? inlineKeyboard : null);
         } else {
           await sendTelegramMessage(chatId, businessConnectionId, messageText, hasValidButtons ? inlineKeyboard : null);
         }
       } else {
         await sendTelegramMessage(chatId, businessConnectionId, 'No message text found. Check the format again.');
       }
       
       if (!hasValidButtons) {
         await sendTelegramMessage(chatId, businessConnectionId, 'No valid button text/url found. Check the format again.');
       }
     }
     else if (message.text.startsWith('/wiki')) {
       await sendTelegramChatAction(chatId, businessConnectionId, 'typing');
       const query = message.text.slice(6).trim();
       const response = await getWikipediaSummary(query);
       const originalUrl = response.content_urls.mobile.page;
       
       if (response.thumbnail && response.originalimage.source) {
         await sendWikiResponse(
           chatId,
           businessConnectionId,
           `<b>${response.title}</b>\n\n${response.extract}`,
           originalUrl,
           response.originalimage.source,
           false
         );
       } else {
         await sendWikiResponse(
           chatId,
           businessConnectionId,
           `<b>${response.title}</b>\n\n${response.extract}`,
           originalUrl
         );
       }
     }
   }  
 else {
   if (message.text.startsWith('/set')) {
     const prompt = message.text.slice(4).trim();
     Systemprompt[senderId] = prompt;
     await sendTelegramMessage(chatId, null, 'System prompt set successfully.');
   } 
  else {
     const defaultMessage = "This is primarily a business bot. Telegram premium users can set it as their chatbot. You can try it out on @blackarachnia. If you want to set a custom system prompt for the AI Model, send /set \"your prompt\".";
       await sendTelegramMessage(chatId, null, defaultMessage);
   }
 } 
 return new Response('Bot is active!');  }
 } catch (error) {
   return new Response('Bot is active!');
 } 
}

async function parseTelegramRequest(request) {
 try {
   const body = await request.text();
   const data = JSON.parse(body);
   if (data.update_id && data.update_id > lastUpdateId) {
     lastUpdateId = data.update_id;
     console.log('Processing : ', data.update_id);
   } else {
     console.log('Skipping old or invalid update');
     return null;
   }
   
   let message = null;
   let senderId = null;
   let chatId = null;
   let businessConnectionId = null;
   
   if (data.business_message) {
     message = data.business_message;
     chatId = message.chat.id || {};
     businessConnectionId = message.business_connection_id;
     senderId = message.from.id;
   } else if (data.message) {
     message = data.message;
     chatId = message.chat.id;
     senderId = message.from.id;
   }
   
   return { message, chatId, businessConnectionId, senderId };
 } catch (error) {
   console.error('Error parsing Telegram request:', error);
 }
}
async function sendTelegramMessage(chatId, businessConnectionId, text, inlineKeyboard) {
 const telegramApiUrl = `https://api.telegram.org/botBOT_TOKEN/sendMessage`;
 
 const payload = {
   chat_id: chatId,
   text: text,
   parse_mode: 'Markdown'
 }; 
 if (inlineKeyboard) {
   payload.reply_markup = {
     inline_keyboard: inlineKeyboard
   };
 }
 if (businessConnectionId !== null) {
   payload.business_connection_id = businessConnectionId;
 }
 
 console.log('Sending message:', payload);
 
 await fetch(telegramApiUrl, {
   method: 'POST',
   body: JSON.stringify(payload),
   headers: {
     'Content-Type': 'application/json',
   },
 });
} 

async function queryGroq(messages,systemPrompt) {
 const groqApiKey = "API_KEY";
 const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
   method: 'POST', 
   headers: {
     'Authorization': `Bearer ${groqApiKey}`, 
     'Content-Type': 'application/json', 
   }, 
   body: JSON.stringify({ 
     "messages": [
       {"role": "system", "content": systemPrompt},
       ...messages
     ],
     "model": "llama3-70b-8192"
   })
 });
 const data = await response.json();
 console.log("response : " ,data)
 return data.choices[0]?.message?.content || "Invalid response from LLM endpoint";
}
async function queryGrammarly(text) {
 try {
   const grammarlyApiUrl = `https://api.safone.dev/grammarly?text=${encodeURIComponent(text)}`;
   const response = await fetch(grammarlyApiUrl);
   const data = await response.json();

   if (data.corrected || data.rewritten) {
     let message = '';
     if (data.corrected) {
       message += `Corrected: ${data.corrected}\n`;
     }
     if (data.rewritten) {
       message += `Rewritten: ${data.rewritten}`;
     }
     return message.trim();
   } else {
     return "No corrections available.";
   }
 } catch (error) {
   console.error('Error querying Grammarly API:', error);
   return "Error in the Grammarly API.";
 }
}
async function getQuote() {
 try {
   const response = await fetch('https://api.safone.dev/quote?type=txt');
   if (!response.ok) {
     throw new Error(`HTTP error! status: ${response.status}`);
   }
   const data = await response.json();
   if (data && data.quote && data.author) {
     return `"${data.quote}" — ${data.author}`;
   } else {
     return 'Error: The response from the API is in an unexpected format.';
   }
 } catch (error) {
   console.error('Error fetching quote:', error);
   return 'Error getting quote:';
 }
}

async function getNasaImage() {
 try {
   const apiKey = 'API_KEY';
   
   const months = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
   const days = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10',
                '11', '12', '13', '14', '15', '16', '17', '18', '19', '20',
                '21', '22', '23', '24', '25', '26', '27', '28'];
   
   const randomMonth = months[Math.floor(Math.random() * months.length)];
   const randomDay = days[Math.floor(Math.random() * days.length)];
   
   const years = ['2007', '2010', '2015', '2020', '2023'];
   const randomYear = years[Math.floor(Math.random() * years.length)];
   
   const randomDate = `${randomYear}-${randomMonth}-${randomDay}`;
   
   const response = await fetch(`https://api.nasa.gov/planetary/apod?api_key=${apiKey}&date=${randomDate}&thumbs=true`);
   
   if (!response.ok) {
     throw new Error(`HTTP error! status: ${response.status}`);
   }
   
   const data = await response.json();
   return data;
 } catch (error) {
   console.error('Error fetching NASA image:', error);
   return null;
 }
} async function getRandomStickerUrl() {
 const stickerUrls = [
   'https://www.gstatic.com/webp/gallery3/1_webp_ll.webp',
   'https://www.gstatic.com/webp/gallery3/2_webp_ll.webp',
   'https://www.gstatic.com/webp/gallery3/3_webp_ll.webp',
   'https://www.gstatic.com/webp/gallery3/4_webp_ll.webp',
   'https://www.gstatic.com/webp/gallery3/5_webp_ll.webp'
 ];
 const randomIndex = Math.floor(Math.random() * stickerUrls.length);
 return stickerUrls[randomIndex];
}

async function sendTelegramPhoto(chatId, businessConnectionId, photoUrl, caption, protectContent = false, inlineKeyboard) {
 const telegramApiUrl = `https://api.telegram.org/botBOT_TOKEN/sendPhoto`;
 //const encodedcaption = encodeURIComponent(caption)
 const payload = {
   business_connection_id: businessConnectionId,
   chat_id: chatId,
   photo: photoUrl,
   has_spoiler: true,
   protect_content: protectContent,  
   caption: caption,
   parse_mode:"Markdown"
 };
 if (inlineKeyboard) {
   payload.reply_markup = {
     inline_keyboard: inlineKeyboard
   };
 }
 await fetch(telegramApiUrl, {
   method: 'POST',
   body: JSON.stringify(payload),
   headers: {
     'Content-Type': 'application/json',
   },
 });
}

async function sendTelegramSticker(chatId, businessConnectionId, stickerUrl, protectContent = false) {
 const telegramApiUrl = `https://api.telegram.org/beta/botBOT_TOKEN/sendSticker`;
 const payload = {
   business_connection_id: businessConnectionId,
   chat_id: chatId,
   sticker: stickerUrl,
   protect_content: protectContent
 };
 console.log('Sending sticker:', payload);
 await fetch(telegramApiUrl, {
   method: 'POST',
   body: JSON.stringify(payload),
   headers: {
     'Content-Type': 'application/json',
   },
 });
}
async function sendTelegramDice(chatId, businessConnectionId, protectContent = false) {
 const telegramApiUrl = `https://api.telegram.org/botBOT_TOKEN/sendDice`;
 const emojis = ['🎲', '🏀', '⚽', '🎰', '🎳'];
 const randomIndex = Math.floor(Math.random() * emojis.length);
 const emoji = emojis[randomIndex];
 const payload = {
   business_connection_id: businessConnectionId,
   chat_id: chatId,
   emoji: emoji,
   protect_content: protectContent
 };
 console.log('Sending dice:', payload);
 await fetch(telegramApiUrl, {
   method: 'POST',
   body: JSON.stringify(payload),
   headers: {
     'Content-Type': 'application/json',
   },
 });
}
async function generateImage(prompt, chatId, businessConnectionId, senderId) {
 try {
   await sendTelegramChatAction(chatId, businessConnectionId, 'upload_photo');
   const response = await fetch('https://api.cloudflare.com/client/v4/accounts/ACCOUNTID/ai/run/@cf/bytedance/stable-diffusion-xl-lightning', {
     method: 'POST',
     headers: {
       'Authorization': 'Bearer API_KEY',
       'Content-Type': 'application/json',
     },
     body: JSON.stringify({ prompt: prompt , num_steps:8 }),
   });

   if (response.ok) {
     const imageData = await response.arrayBuffer(); 
     const fileName = `generated_image_${Date.now()}.png`;
     const file = new File([imageData], fileName, { type: 'image/png' });
     
     await sendTelegramPhotoMultipart(chatId, businessConnectionId, file, false, senderId);
   } else {
     console.error('Error generating image:', response.statusText);
     await sendTelegramMessage(chatId, businessConnectionId, 'Error generating image. Please try again later.');
   }
 } catch (error) {
   console.error('Error generating image:', error);
   await sendTelegramMessage(chatId, businessConnectionId, 'Error generating image. Please try again later.');
 }
}
async function sendTelegramPhotoMultipart(chatId, businessConnectionId, file, protectContent = false, senderId) {
 const telegramApiUrl = `https://api.telegram.org/botBOT_TOKEN/sendPhoto`;
 const caption = `Generated using SDXL-Lightning⚡ by 🚀 user: ${senderId}`;
 
 // Calculate the offset and length for the custom emoji
 const emojiOffset = caption.indexOf('⚡');
 const emojiLength = '⚡'.length;
 
 // Calculate the offset and length for the rocket emoji
 const rocketOffset = caption.indexOf('🚀');
 const rocketLength = '🚀'.length;
 
 // Convert senderId to a string
 const senderIdString = senderId.toString();
 
 // Create the entities array
 const entities = [
   {
     offset: caption.indexOf('SDXL-Lightning'),
     length: 'SDXL-Lightning'.length,
     type: 'bold',
   },
   {
     offset: emojiOffset,
     length: emojiLength,
     type: 'custom_emoji',
     custom_emoji_id: '5456140674028019486',
   },
   {
     offset: rocketOffset,
     length: rocketLength,
     type: 'custom_emoji',
     custom_emoji_id: '5165976888283234815',
   },
   {
     offset: caption.indexOf(senderIdString),
     length: senderIdString.length,
     type: 'text_mention',
     user: {
       id: senderId,
     },
   },
 ];

 const formData = new FormData();
 formData.append('business_connection_id', businessConnectionId);
 formData.append('chat_id', chatId);
 formData.append('photo', file);
 formData.append('caption', caption);
 formData.append('caption_entities', JSON.stringify(entities));
 formData.append('has_spoiler', 'true');
 formData.append('protect_content', protectContent.toString());

 await fetch(telegramApiUrl, {
   method: 'POST',
   body: formData,
 });
}
async function sendTelegramChatAction(chatId, businessConnectionId, action) {
 const telegramApiUrl = `https://api.telegram.org/botBOT_TOKEN/sendChatAction`;
 const payload = {
   business_connection_id: businessConnectionId,
   chat_id: chatId,
   action: action,
 };
 await fetch(telegramApiUrl, {
   method: 'POST',
   body: JSON.stringify(payload),
   headers: {
     'Content-Type': 'application/json',
   },
 });
}

async function getWikipediaSummary(query) {
 try {
   const response = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}?redirect=true`);
   if (!response.ok) {
     throw new Error(`HTTP error! status: ${response.status}`);
   }
   const data = await response.json();
   return data;
 } catch (error) {
   console.error('Error fetching Wikipedia summary:', error);
   return null;
 }
}
async function sendWikiResponse(chatId, businessConnectionId, text, originalUrl, photoUrl = null, protectContent = false) {
 let telegramApiUrl = `https://api.telegram.org/botBOT_TOKEN/sendMessage`;
 let payload = {
   business_connection_id: businessConnectionId,
   chat_id: chatId,
   text: text,
   parse_mode: "HTML",
   protect_content: protectContent,
   reply_markup: {
     inline_keyboard: [
       [
         {
           text: "View on Wikipedia",
           url: originalUrl
         }
       ]
     ]
   }
 };

 if (photoUrl) {
   telegramApiUrl = `https://api.telegram.org/botBOT_TOKEN/sendPhoto`;
   payload.photo = photoUrl;
   payload.caption = text;
   payload.parse_mode = "HTML";
   delete payload.text;
 }

 await fetch(telegramApiUrl, {
   method: 'POST',
   body: JSON.stringify(payload),
   headers: {
     'Content-Type': 'application/json',
   },
 });
}
async function getCatFact() {
    try {
        const response = await fetch('https://catfact.ninja/fact');
        const data = await response.json();
        return data.fact;
    } catch (error) {
        console.error('Error fetching cat fact:', error);
        return 'Could not fetch a cat fact at this time.';
    }
}
