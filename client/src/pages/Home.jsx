import { Link } from 'react-router-dom';
import RecommendedExperts from '../components/RecommendedExperts';

const CATEGORIES = ['Technology', 'Finance', 'Legal', 'Healthcare', 'Marketing', 'Design'];

const Home = () => {
  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-extrabold mb-4 leading-tight">
            Connect with Top Experts <br className="hidden sm:block" />
            <span className="text-blue-200">On Demand</span>
          </h1>
          <p className="text-blue-100 text-lg mb-8 max-w-2xl mx-auto">
            ExpertConnect helps you find verified professionals in technology, finance, legal,
            healthcare, and more. Book a session in minutes.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/experts"
              id="cta-find-experts"
              className="bg-white text-blue-700 hover:bg-blue-50 font-semibold py-3 px-8 rounded-lg transition-colors text-lg"
            >
              Find Experts
            </Link>
            <Link
              to="/signup"
              id="cta-join"
              className="border-2 border-white text-white hover:bg-white hover:text-blue-700 font-semibold py-3 px-8 rounded-lg transition-colors text-lg"
            >
              Join as Expert
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-10 bg-white border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 grid grid-cols-3 gap-8 text-center">
          {[
            { num: '500+', label: 'Verified Experts' },
            { num: '2,000+', label: 'Sessions Completed' },
            { num: '50+', label: 'Domains Covered' },
          ].map(({ num, label }) => (
            <div key={label}>
              <div className="text-3xl font-extrabold text-blue-600">{num}</div>
              <div className="text-sm text-gray-500 mt-1">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">Browse by Category</h2>
          <p className="text-gray-500 text-center mb-8">Find the right expert for your domain</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {CATEGORIES.map((cat) => (
              <Link
                key={cat}
                to={`/experts?category=${cat}`}
                className="card flex items-center gap-3 hover:border-blue-300 cursor-pointer group"
              >
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center group-hover:bg-blue-600 transition-colors">
                  <span className="text-blue-600 group-hover:text-white text-lg transition-colors">
                    {cat === 'Technology' ? '💻' : cat === 'Finance' ? '💰' : cat === 'Legal' ? '⚖️' : cat === 'Healthcare' ? '🏥' : cat === 'Marketing' ? '📈' : '🎨'}
                  </span>
                </div>
                <span className="font-medium text-gray-800 group-hover:text-blue-600 transition-colors">{cat}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 🤖 Personalized Recommendations */}
      <RecommendedExperts />

      {/* How It Works */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-10">How It Works</h2>
          <div className="grid sm:grid-cols-3 gap-8">
            {[
              { step: '1', title: 'Create Account', desc: 'Sign up in under a minute as a user or expert.' },
              { step: '2', title: 'Find Your Expert', desc: 'Browse profiles, filter by skills and rate.' },
              { step: '3', title: 'Book a Session', desc: 'Send a booking request and connect instantly.' },
            ].map(({ step, title, desc }) => (
              <div key={step} className="text-center">
                <div className="w-12 h-12 rounded-full bg-blue-600 text-white font-bold text-xl flex items-center justify-center mx-auto mb-4">
                  {step}
                </div>
                <h3 className="font-semibold text-lg text-gray-900 mb-2">{title}</h3>
                <p className="text-gray-500 text-sm">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="py-14 px-4 bg-blue-600 text-white text-center">
        <h2 className="text-2xl font-bold mb-3">Ready to get started?</h2>
        <p className="text-blue-100 mb-6">Join thousands of people connecting with experts daily.</p>
        <Link to="/signup" className="bg-white text-blue-700 hover:bg-blue-50 font-semibold py-3 px-8 rounded-lg transition-colors">
          Get Started Free
        </Link>
      </section>
    </div>
  );
};

export default Home;
