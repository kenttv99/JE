'use client';

import { useState } from 'react';

interface Appeal {
  id: string;
  subject: string;
  date: string;
  status: 'open' | 'closed' | 'pending';
  messages: Array<{
    id: string;
    text: string;
    sender: string;
    timestamp: string;
  }>;
}

export default function AppealsPage() {
  const [appeals, setAppeals] = useState<Appeal[]>([]);
  const [selectedAppeal, setSelectedAppeal] = useState<Appeal | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [newAppealSubject, setNewAppealSubject] = useState('');

  const handleCreateAppeal = () => {
    if (!newAppealSubject.trim()) return;

    const newAppeal: Appeal = {
      id: Math.random().toString(36).substr(2, 9),
      subject: newAppealSubject,
      date: new Date().toISOString(),
      status: 'open',
      messages: []
    };

    setAppeals([newAppeal, ...appeals]);
    setNewAppealSubject('');
  };

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedAppeal) return;

    const updatedAppeals = appeals.map(appeal => {
      if (appeal.id === selectedAppeal.id) {
        return {
          ...appeal,
          messages: [...appeal.messages, {
            id: Math.random().toString(36).substr(2, 9),
            text: newMessage,
            sender: 'trader',
            timestamp: new Date().toISOString()
          }]
        };
      }
      return appeal;
    });

    setAppeals(updatedAppeals);
    setNewMessage('');
  };

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="bg-blue-500 px-6 py-4">
        <h1 className="text-2xl font-bold text-white">Обращения</h1>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Appeals List */}
          <div className="md:col-span-1 border-r border-gray-200">
            <div className="mb-4">
              <input
                type="text"
                placeholder="Тема обращения"
                value={newAppealSubject}
                onChange={(e) => setNewAppealSubject(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
              <button
                onClick={handleCreateAppeal}
                className="mt-2 w-full px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
              >
                Создать обращение
              </button>
            </div>

            <div className="space-y-2">
              {appeals.map((appeal) => (
                <div
                  key={appeal.id}
                  onClick={() => setSelectedAppeal(appeal)}
                  className={`p-3 rounded-md cursor-pointer ${
                    selectedAppeal?.id === appeal.id
                      ? 'bg-blue-50 border-blue-500'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <h3 className="font-medium">{appeal.subject}</h3>
                  <p className="text-sm text-gray-500">
                    {new Date(appeal.date).toLocaleDateString()}
                  </p>
                  <span
                    className={`inline-block px-2 py-1 text-xs rounded-full ${
                      appeal.status === 'open'
                        ? 'bg-green-100 text-green-800'
                        : appeal.status === 'closed'
                        ? 'bg-gray-100 text-gray-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {appeal.status === 'open' ? 'Открыто' : appeal.status === 'closed' ? 'Закрыто' : 'В обработке'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Chat Area */}
          <div className="md:col-span-2">
            {selectedAppeal ? (
              <div className="h-full flex flex-col">
                <div className="border-b border-gray-200 p-4">
                  <h2 className="text-lg font-medium">{selectedAppeal.subject}</h2>
                  <p className="text-sm text-gray-500">
                    {new Date(selectedAppeal.date).toLocaleString()}
                  </p>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {selectedAppeal.messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${
                        message.sender === 'trader' ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      <div
                        className={`max-w-xs px-4 py-2 rounded-lg ${
                          message.sender === 'trader'
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-100'
                        }`}
                      >
                        <p>{message.text}</p>
                        <p className="text-xs mt-1 opacity-75">
                          {new Date(message.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-gray-200 p-4">
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Введите сообщение..."
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                    />
                    <button
                      onClick={handleSendMessage}
                      className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                    >
                      Отправить
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500">
                Выберите обращение для просмотра
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}