import Link from 'next/link';

const QuizCTA = () => {
  return (
    <section className="py-12 md:py-20 bg-gradient-to-r from-purple-600 to-blue-600 text-white">
      <div className="container mx-auto px-6 text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-6">
          Up for a Challenge? Test Your Skills!
        </h2>
        <p className="mb-8 text-lg md:text-xl opacity-90 max-w-2xl mx-auto">
          Our brand new interactive quizzes are here! Start with our engaging Single Selection questions
          and prove your expertise. More question types are on the way. Dare to see your score?
        </p>
        <div className="flex flex-col md:flex-row justify-center gap-4">
          <Link
            href="/quiz/azure-a102" // Updated to new canonical quiz route
            className="inline-block bg-white hover:bg-gray-100 text-purple-700 font-bold py-3 px-10 rounded-lg text-lg transition duration-300 ease-in-out transform hover:scale-105 shadow-lg"
          >
            Take the Challenge!
          </Link>
          <Link
            href="/quizzes"
            className="inline-block bg-blue-800 hover:bg-blue-900 text-white font-bold py-3 px-10 rounded-lg text-lg transition duration-300 ease-in-out transform hover:scale-105 shadow-lg"
          >
            Browse Quizzes
          </Link>
        </div>
      </div>
    </section>
  );
};

export default QuizCTA; 