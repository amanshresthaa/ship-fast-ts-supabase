```typescript
// app/quizzes/page.tsx
import Link from 'next/link';
import config from '@/config'; // Assuming a config file for appName
// import { getAllQuizzes } from '@/lib/quizService'; // Hypothetical function to fetch all quizzes

export default async function QuizzesPage() {
  // const quizzes = await getAllQuizzes(); // Example: Fetch quizzes

  // Placeholder data if quiz fetching isn't set up yet
  const quizzes = [
    { id: 'azure-a102', title: 'Azure A102 Practice Quiz', description: 'Test your knowledge for the Azure A102 exam.' },
    { id: 'aws-saa-c03', title: 'AWS Certified Solutions Architect - Associate (SAA-C03) Quiz', description: 'Prepare for the AWS SAA-C03 certification.' },
    { id: 'gcp-ace', title: 'Google Cloud Associate Cloud Engineer Quiz', description: 'Validate your skills for the GCP ACE exam.' },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <header className="mb-12 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
          Available Quizzes on {config.appName}
        </h1>
        <p className="mt-3 text-lg leading-7 text-gray-600">
          Choose from our selection of practice quizzes to test your knowledge.
        </p>
      </header>

      {quizzes && quizzes.length > 0 ? (
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {quizzes.map((quiz) => (
            <div key={quiz.id} className="bg-white shadow-lg rounded-lg overflow-hidden">
              <div className="p-6">
                <h2 className="text-xl font-semibold mb-2 text-gray-800">{quiz.title}</h2>
                <p className="text-gray-600 mb-4 text-sm">{quiz.description}</p>
                <Link
                  href={`/quizzes/${quiz.id}`}
                  className="inline-block rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                >
                  Start Quiz
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-center text-gray-500">No quizzes available at the moment. Please check back later.</p>
      )}
    </div>
  );
}
```
