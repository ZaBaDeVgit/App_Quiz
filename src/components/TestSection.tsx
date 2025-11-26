import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Categories, Question, TestResult } from '../types';
import { saveTestResult } from '../utils/storage';
import Swal from 'sweetalert2';

export default function TestSection() {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('');
  const [testStarted, setTestStarted] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [categories, setCategories] = useState<Categories>({});
  const [answered, setAnswered] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [incorrectAnswer, setIncorrectAnswer] = useState<number | null>(null);

  const getFilteredQuestions = (category: string, topic: string) => {
    return questions.filter((question) => {
      return question.category === category && question.topic === topic;
    });
  };

  const finishTest = useCallback(() => {
    setTestStarted(false);
    setIsTimerRunning(false);

    const result: TestResult = {
      category: selectedCategory,
      topic: selectedTopic,
      score: score + 1,  // Ajusta para reflejar la puntuación correcta
      total: questions.length,
      date: new Date().toISOString().split('T')[0],
    };

    saveTestResult(result);
    navigate('/scores');
  }, [selectedCategory, selectedTopic, score, questions.length, navigate]);

  useEffect(() => {
    if (testStarted && timeLeft > 0 && isTimerRunning) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);

      return () => clearInterval(timer);
    } else if (timeLeft === 0 && testStarted) {
      finishTest();
    }
  }, [timeLeft, testStarted, isTimerRunning, finishTest]);

  useEffect(() => {
    const loadQuestions = async () => {
      try {
        const response = await fetch(`${import.meta.env.BASE_URL}preguntas.json`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        const categoryTopics: { [key: string]: string[] } = {};

        data.forEach((question: Question) => {
          if (!categoryTopics[question.category]) {
            categoryTopics[question.category] = [];
          }
          if (!categoryTopics[question.category].includes(question.topic)) {
            categoryTopics[question.category].push(question.topic);
          }
        });

        setCategories(categoryTopics);
        setQuestions(data);
      } catch (error) {
        console.error('Error al cargar el JSON:', error);
      }
    };

    loadQuestions();
  }, []);

  const startTest = () => {
    const filteredQuestions = getFilteredQuestions(selectedCategory, selectedTopic);

    if (filteredQuestions.length === 0) {
      Swal.fire({
        icon: 'error',
        title: 'No hay preguntas disponibles',
        text: 'No hay preguntas para esta categoría y tema.',
        confirmButtonText: 'Aceptar'
      });
      return;
    }

    setQuestions(filteredQuestions);
    setTestStarted(true);
    setIsTimerRunning(true);
    setTimeLeft(30);
    setScore(0);
    setCurrentQuestion(0);
  };

  const handleAnswer = (selectedIndex: number) => {
    if (answered) return;
    setAnswered(true);
    setSelectedAnswer(selectedIndex);

    if (questions[currentQuestion].correct === selectedIndex) {
      setScore((prev) => prev + 1);
    } else {
      setIncorrectAnswer(questions[currentQuestion].correct); // Store the correct answer if it's incorrect
    }

    setTimeout(() => {
      if (currentQuestion + 1 < questions.length) {
        setCurrentQuestion((prev) => prev + 1);
        setTimeLeft(30);
        setAnswered(false);
        setSelectedAnswer(null);
        setIncorrectAnswer(null); // Reset incorrect answer
      } else {
        finishTest();
      }
    }, 3000); // Wait for 3 seconds before going to next question
  };

  const resetTest = () => {
    setScore(0);
    setCurrentQuestion(0);
    setTimeLeft(30);
    setAnswered(false);
    setSelectedAnswer(null);
    setIncorrectAnswer(null); // Reset incorrect answer
  };

  // Determinar el color del temporizador según el tiempo restante
  const timerColor = timeLeft <= 10 ? 'bg-red-600' : timeLeft <= 20 ? 'bg-yellow-500' : 'bg-green-500';

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-gradient-to-br from-blue-800 to-green-700 bg-[length:400%_400%] animate-gradient-x">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-4xl bg-opacity-90 rounded-2xl p-6 shadow-xl"
      >
        <h2 className="text-4xl font-extrabold text-white mb-8 text-center relative">
          {!testStarted ? 'Selecciona una Prueba' : 'Sección de Prueba'}
          <span className="absolute inset-0 bg-gradient-to-br from-indigo-400 to-green-500 opacity-20 blur-md animate-pulse"></span>
        </h2>

        {!testStarted && (
          <>
            <div className="space-y-6">
              <div>
                <label className="text-white text-lg font-semibold">Categoría</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full p-4 rounded-2xl bg-white text-black shadow-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all text-lg"
                >
                  <option value="">Selecciona una categoría</option>
                  {Object.keys(categories).map((cat) => (
                    <option
                      key={cat}
                      value={cat}
                      className="bg-white text-black hover:bg-purple-200"
                    >
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-white text-lg font-semibold">Tema</label>
                <select
                  value={selectedTopic}
                  onChange={(e) => setSelectedTopic(e.target.value)}
                  className="w-full p-4 rounded-2xl bg-white text-black shadow-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all text-lg"
                >
                  <option value="">Selecciona un tema</option>
                  {selectedCategory &&
                    categories[selectedCategory]?.map((topic, index) => (
                      <option
                        key={index}
                        value={topic}
                        className="bg-white text-black hover:bg-purple-200"
                      >
                        {topic}
                      </option>
                    ))}
                </select>
              </div>
            </div>

            <div className="flex justify-center mt-8 space-x-6">
              <motion.button
                onClick={() => navigate('/')}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center px-8 py-4 bg-gradient-to-r from-indigo-500 to-blue-600 rounded-lg text-white font-semibold shadow-xl hover:shadow-2xl transition-all text-shadow-3d"
              >
                <ArrowLeft className="w-6 h-6 mr-2" />
                Volver al Menú
              </motion.button>

              <motion.button
                onClick={startTest}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 bg-gradient-to-r from-green-500 to-teal-600 rounded-lg text-white font-semibold shadow-xl hover:shadow-2xl transition-all text-shadow-3d"
              >
                Comenzar Prueba
              </motion.button>
            </div>
          </>
        )}

        {testStarted && (
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl text-white font-semibold relative">
                Pregunta {currentQuestion + 1} de {questions.length}
                <span className="absolute inset-0 bg-gradient-to-br from-indigo-400 to-pink-500 opacity-20 blur-md animate-pulse"></span>
              </h3>

              {/* Panel dinámico de puntuación */}
              <div className="flex items-center space-x-3 text-white bg-gradient-to-r from-purple-600 to-indigo-600 p-4 rounded-lg shadow-xl text-shadow-3d">
                <span className="text-xl font-semibold">Puntuación: {score}</span>
              </div>

              {/* Temporizador con color dinámico */}
              <div className={`${timerColor} px-4 py-2 rounded-lg text-white font-bold text-shadow-3d`}>
                <Clock className="w-5 h-5 mr-2" />
                {timeLeft}s
              </div>
            </div>

            <p className="text-white text-xl font-medium">{questions[currentQuestion].question}</p>

            <div className="space-y-4">
              {questions[currentQuestion].options.map((option, index) => {
                const isCorrect = questions[currentQuestion].correct === index;
                const isSelected = selectedAnswer === index;
                const isIncorrect = incorrectAnswer === index;

                const optionClass = isSelected
                  ? isCorrect
                    ? 'bg-green-500'
                    : 'bg-red-600'
                  : isIncorrect
                    ? 'bg-green-500'
                    : 'bg-white bg-opacity-10';

                return (
                  <button
                    key={index}
                    onClick={() => handleAnswer(index)}
                    disabled={answered}
                    className={`w-full p-5 rounded-lg border border-white border-opacity-20 text-white text-left focus:outline-none ${optionClass} ${!answered ? 'hover:bg-purple-700' : ''} text-shadow-3d`}
                  >
                    {option}
                  </button>
                );
              })}
            </div>

            <div className="flex justify-center mt-8 space-x-6">
              {/* Botón para reiniciar la prueba */}
              <motion.button
                onClick={resetTest}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 bg-gradient-to-r from-red-600 to-red-800 rounded-lg text-white font-semibold shadow-xl hover:shadow-2xl transition-all text-shadow-3d"
              >
                Reiniciar Prueba
              </motion.button>

              {/* Botón para cancelar y salir al menú principal */}
              <motion.button
                onClick={() => navigate('/')}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 bg-gradient-to-r from-indigo-500 to-blue-600 rounded-lg text-white font-semibold shadow-xl hover:shadow-2xl transition-all text-shadow-3d"
              >
                Cancelar y Volver al Menú
              </motion.button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
