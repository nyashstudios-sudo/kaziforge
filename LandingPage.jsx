import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Zap, Shield, Globe, Smartphone, Megaphone, Video, Brain, PenTool, Headset } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="bg-gray-50 min-h-screen font-sans">
      {/* Navbar */}
      <nav className="bg-white border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold">KF</div>
            <span className="text-2xl font-bold tracking-tight">KaziForge</span>
          </div>
          <div className="hidden md:flex gap-8 text-gray-600 font-medium">
            <a href="#features" className="hover:text-indigo-600">Features</a>
            <a href="#how-it-works" className="hover:text-indigo-600">How it works</a>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/login" className="text-gray-700 hover:text-gray-900 font-medium">Log In</Link>
            <Link to="/signup" className="bg-indigo-600 text-white px-6 py-2.5 rounded-2xl font-semibold hover:bg-indigo-700 transition shadow-lg shadow-indigo-200">
              Join Now
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="max-w-7xl mx-auto px-6 py-24 grid md:grid-cols-2 gap-16 items-center">
        <div>
          <h1 className="text-6xl font-extrabold text-gray-900 leading-[1.1]">
            Your Skill, <br /><span className="text-indigo-600">Our Mission.</span>
          </h1>
          <p className="mt-8 text-xl text-gray-600 leading-relaxed">
            KaziForge is the premier marketplace for global talent. Whether you're a Skiller looking for gigs or a Client building the next big thing, we've got you covered.
          </p>
          <div className="mt-12 flex flex-col sm:flex-row gap-4">
            <Link to="/signup" className="bg-indigo-600 text-white px-10 py-5 rounded-3xl font-bold text-lg flex items-center justify-center gap-2 hover:bg-indigo-700 transition shadow-xl shadow-indigo-200">
              Get Started <ArrowRight size={20} />
            </Link>
            <Link to="/login" className="bg-white border-2 border-gray-200 text-gray-700 px-10 py-5 rounded-3xl font-bold text-lg flex items-center justify-center hover:border-indigo-600 hover:text-indigo-600 transition">
              Explore Gigs
            </Link>
          </div>
        </div>
        <div className="relative">
          <img src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=800&q=80" alt="Collaboration" className="rounded-[40px] shadow-2xl rotate-2" />
          <div className="absolute -bottom-6 -left-6 bg-white p-6 rounded-3xl shadow-xl flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center text-green-600 text-2xl">✓</div>
            <div>
              <div className="font-bold">Verified Skillers</div>
              <div className="text-sm text-gray-500">Quality work guaranteed</div>
            </div>
          </div>
        </div>
      </header>

      {/* Features */}
      <section id="features" className="bg-white py-24">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-4xl font-bold text-center mb-16">Why Choose KaziForge?</h2>
          <div className="grid md:grid-cols-3 gap-12">
            <div className="group p-8 rounded-3xl hover:bg-indigo-50 transition border border-transparent hover:border-indigo-100">
              <div className="w-14 h-14 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition">
                <Zap size={28} />
              </div>
              <h3 className="text-xl font-bold mb-4">Fast Matching</h3>
              <p className="text-gray-600">Find the perfect Skiller or Project in minutes with our advanced filtering and matching logic.</p>
            </div>
            <div className="group p-8 rounded-3xl hover:bg-emerald-50 transition border border-transparent hover:border-emerald-100">
                <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition">
                    <Shield size={28} />
                </div>
                <h3 className="text-xl font-bold mb-4">Secure Payments</h3>
                <p className="text-gray-600">Your funds are protected with our milestone-based payment system. Peace of mind for everyone.</p>
            </div>
            <div className="group p-8 rounded-3xl hover:bg-purple-50 transition border border-transparent hover:border-purple-100">
                <div className="w-14 h-14 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition">
                    <Globe size={28} />
                </div>
                <h3 className="text-xl font-bold mb-4">Global Reach</h3>
                <p className="text-gray-600">Scale your business or career globally. Connect with clients and talent from every corner of the world.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Skills Grid */}
      <section className="bg-gray-50 py-24">
        <div className="max-w-7xl mx-auto px-6">
            <h2 className="text-4xl font-bold mb-16">Explore the Marketplace</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {[
                    { name: 'Web Dev', icon: <Zap />, color: 'bg-blue-100 text-blue-600' },
                    { name: 'UI/UX Design', icon: <PenTool />, color: 'bg-pink-100 text-pink-600' },
                    { name: 'Mobile Apps', icon: <Smartphone />, color: 'bg-indigo-100 text-indigo-600' },
                    { name: 'Digital Marketing', icon: <Megaphone />, color: 'bg-orange-100 text-orange-600' },
                    { name: 'AI Solutions', icon: <Brain />, color: 'bg-purple-100 text-purple-600' },
                    { name: 'Video Editing', icon: <Video />, color: 'bg-red-100 text-red-600' },
                    { name: 'Virtual Support', icon: <Headset />, color: 'bg-green-100 text-green-600' },
                    { name: 'Cyber Security', icon: <Shield />, color: 'bg-slate-100 text-slate-600' },
                ].map((skill, i) => (
                    <div key={i} className="bg-white p-6 rounded-3xl border border-gray-100 hover:border-indigo-200 hover:shadow-lg transition cursor-pointer group">
                        <div className={`w-12 h-12 ${skill.color} rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition`}>
                            {React.cloneElement(skill.icon, { size: 24 })}
                        </div>
                        <h4 className="font-bold text-gray-900">{skill.name}</h4>
                        <p className="text-xs text-gray-500 mt-1">100+ Skillers</p>
                    </div>
                ))}
            </div>
        </div>
      </section>

      {/* CTA */}
      <section id="get-started" className="max-w-7xl mx-auto px-6 py-24">
        <div className="bg-indigo-600 rounded-[48px] p-16 text-center text-white relative overflow-hidden">
          <div className="relative z-10">
            <h2 className="text-5xl font-bold">Ready to build your future?</h2>
            <p className="mt-6 text-xl text-indigo-100 opacity-90">Join thousands of Skillers and Clients today.</p>
            <div className="mt-12 flex justify-center gap-6">
              <Link to="/signup" className="bg-white text-indigo-600 px-10 py-5 rounded-3xl font-bold text-lg hover:bg-gray-100 transition shadow-xl">
                Create Account
              </Link>
            </div>
          </div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -mr-32 -mt-32"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-white opacity-5 rounded-full -ml-32 -mb-32"></div>
        </div>
      </section>

      <footer className="bg-white border-t py-12 text-center text-gray-500 text-sm">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-6 h-6 bg-indigo-600 rounded-lg"></div>
            <span className="font-bold text-gray-900">KaziForge</span>
          </div>
          <p>© {new Date().getFullYear()} KaziForge Platform. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}