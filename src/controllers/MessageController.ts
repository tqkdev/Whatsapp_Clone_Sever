//   export const getMessages = async (req: Request, res: Response) => {
//     const { conversationId } = req.params;
//     try {
//       const messagesRef = collection(firestoredatabase, `conversations/${conversationId}/messages`);
//       const snapshot = await getDocs(messagesRef);
//       const messages: Message[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message));
//       res.status(200).json(messages);
//     } catch (error) {
//       res.status(500).send(error.message);
//     }
//   };

//   export const sendMessage = async (req: Request, res: Response) => {
//     const { conversationId } = req.params;
//     const { senderId, content } = req.body;

//     try {
//       const messagesRef = collection(firestoredatabase, `conversations/${conversationId}/messages`);
//       const newMessage: Omit<Message, 'id'> = {
//         conversationId,
//         senderId,
//         content,
//         timestamp: new Date().toISOString()
//       };
//       const messageDoc = await addDoc(messagesRef, newMessage);

//       // Cập nhật lastMessageTimestamp trong tài liệu conversation
//       const conversationRef = doc(firestoredatabase, 'conversations', conversationId);
//       await updateDoc(conversationRef, {
//         lastMessageTimestamp: newMessage.timestamp
//       });

//       res.status(200).send(`Message sent with ID: ${messageDoc.id}`);
//     } catch (error) {
//       res.status(500).send(error.message);
//     }
//   };
