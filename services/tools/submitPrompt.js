import axios from 'axios';

import { addDoc, collection, Timestamp } from 'firebase/firestore';

import { firestore } from '../../firebase/firebaseSetup'; // Import the existing Firestore instance

/**
 * Save the tool session response to Firestore
 * @param {object} sessionData - The data to be saved to Firestore
 */
const saveResponseToFirestore = async (sessionData) => {
  try {
    await addDoc(collection(firestore, 'toolSessions'), {
      ...sessionData,
      createdAt: Timestamp.fromMillis(Date.now()),
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error saving tool session to Firestore:', error);
  }
};

const submitPrompt = async (payload) => {
  try {
    const url = `${process.env.NEXT_PUBLIC_MARVEL_ENDPOINT}submit-tool`;

    const response = await axios.post(url, payload, {
      headers: {
        'Content-Type': 'application/json',
        'API-Key': 'dev',
      },
    });

    // Safely extract the topic from inputs
    const topicInput = payload.tool_data.inputs.find(
      (input) => input.name === 'topic'
    );
    const topic = topicInput ? topicInput.value : null;

    // Extract necessary data for Firestore
    const sessionData = {
      response: response.data.data,
      toolId: payload.tool_data.tool_id, // Extract toolId from tool_data
      topic, // Use the safely extracted topic
      userId: payload.user.id, // Extract userId from user
    };

    // non-blocking: Save the response to Firestore
    saveResponseToFirestore(sessionData);

    return response.data?.data;
  } catch (err) {
    const { response } = err;

    // eslint-disable-next-line no-console
    console.error('Error sending request:', err);

    throw new Error(
      response?.data?.message || `Error: could not send prompt, ${err}`
    );
  }
};

export default submitPrompt;
