"use client"

import { motion } from "framer-motion"
import { ArrowRight, Activity, Zap, Shield, Check, Play, ChevronRight, BarChart3, Target } from "lucide-react"
import { Link } from "react-router-dom"

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-[#030712] text-white selection:bg-blue-500/30">
      {/* Navbar Overlay */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/5 bg-[#030712]/80">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-8 h-8 text-blue-500" />
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600">
              SkillSync
            </span>
          </div>
          <div className="flex items-center gap-6">
            <Link to="/login" className="text-gray-300 hover:text-white transition-colors text-sm font-medium">
              Log In
            </Link>
            <Link 
              to="/signup" 
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-all shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:shadow-[0_0_30px_rgba(37,99,235,0.5)]"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      <main className="pt-32 pb-20">
        {/* Hero Section */}
        <section className="relative px-6 max-w-7xl mx-auto mb-32">
            {/* Background Glows */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-blue-600/20 rounded-full blur-[120px] -z-10" />
            <div className="absolute bottom-0 right-0 w-[600px] h-[400px] bg-purple-600/10 rounded-full blur-[100px] -z-10" />

            <div className="text-center max-w-4xl mx-auto mb-16">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border-blue-500/20 mb-8"
              >
                <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                <span className="text-blue-200 text-xs font-medium uppercase tracking-wider">AI Powered Analysis</span>
              </motion.div>
              
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="text-5xl md:text-7xl font-bold mb-8 leading-tight tracking-tight"
              >
                Train with <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">Precision</span>. Not Guesswork.
              </motion.h1>
              
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed"
              >
                Advanced AI focused on your form. Get real-time biomechanical feedback for Yoga, Gym, and Rehabilitation exercises directly from your webcam.
              </motion.p>
              
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="flex flex-col sm:flex-row items-center justify-center gap-4"
              >
                <Link 
                  to="/signup"
                  className="px-8 py-4 bg-white text-black font-bold rounded-xl hover:bg-gray-200 transition-all flex items-center gap-2 group shadow-[0_0_40px_rgba(255,255,255,0.1)]"
                >
                  Start Analyzing Now
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
                <button className="px-8 py-4 glass hover:bg-white/10 text-white rounded-xl font-medium transition-all flex items-center gap-2">
                  <Play className="w-4 h-4 fill-white" />
                  Watch Demo
                </button>
              </motion.div>
            </div>

            {/* Hero Visual */}
            <motion.div 
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.4 }}
              className="relative mx-auto max-w-5xl aspect-video rounded-2xl overflow-hidden glass border-white/10 shadow-2xl ring-1 ring-white/10"
            >
               {/* Simulation of UI Interface */}
               <div className="absolute inset-0 bg-[#0f172a]/80 backdrop-blur-sm flex items-center justify-center">
                   <div className="text-center space-y-4">
                       <Activity className="w-16 h-16 text-blue-500 mx-auto animate-pulse" />
                       <div className="flex gap-8 text-sm">
                            <div className="flex flex-col items-center gap-1">
                                <span className="text-gray-400">Accuracy</span>
                                <span className="text-2xl font-bold text-green-400">98%</span>
                            </div>
                            <div className="flex flex-col items-center gap-1">
                                <span className="text-gray-400">Alignment</span>
                                <span className="text-2xl font-bold text-blue-400">Perfect</span>
                            </div>
                            <div className="flex flex-col items-center gap-1">
                                <span className="text-gray-400">Tempo</span>
                                <span className="text-2xl font-bold text-purple-400">2.1s</span>
                            </div>
                       </div>
                   </div>
                   {/* Grid Overlay */}
                   <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_at_center,black_50%,transparent_100%)] pointer-events-none" />
               </div>
            </motion.div>
        </section>

        {/* Features Grid */}
        <section className="mb-32 max-w-7xl mx-auto px-6">
            <div className="grid md:grid-cols-3 gap-8">
                {[
                    {
                        icon: <Target className="w-6 h-6 text-blue-400" />,
                        title: "Real-time Detection",
                        desc: "Visual skeleton tracking with instant feedback on joint angles and posture."
                    },
                    {
                        icon: <Shield className="w-6 h-6 text-purple-400" />,
                        title: "Injury Prevention",
                        desc: "Protect yourself from bad form. Our AI alerts you instantly when alignment is off."
                    },
                    {
                        icon: <BarChart3 className="w-6 h-6 text-green-400" />,
                        title: "Progress Tracking",
                        desc: "Detailed analytics and XP system to gamify your recovery and training."
                    }
                ].map((feature, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.1 }}
                        className="p-8 rounded-2xl glass hover:bg-white/5 border-white/5 transition-all group cursor-default"
                    >
                        <div className="w-12 h-12 rounded-lg bg-white/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 border border-white/5">
                            {feature.icon}
                        </div>
                        <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                        <p className="text-gray-400 leading-relaxed">{feature.desc}</p>
                    </motion.div>
                ))}
            </div>
        </section>

        {/* Use Cases */}
        <section className="mb-32 max-w-7xl mx-auto px-6">
            <div className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 rounded-3xl p-1 md:p-12 border border-white/5 overflow-hidden relative">
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />
                
                <div className="grid md:grid-cols-2 gap-12 items-center relative z-10 px-6 py-8 md:px-0 md:py-0">
                    <div>
                        <h2 className="text-3xl md:text-4xl font-bold mb-6">Built for Every Body.</h2>
                        <ul className="space-y-6">
                            {[
                                "Physiotherapy & Rehabilitation",
                                "Yoga & Flexibility Training",
                                "Strength & Calisthenics",
                                "Home Workouts"
                            ].map((item, i) => (
                                <li key={i} className="flex items-center gap-4">
                                    <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center">
                                        <Check className="w-4 h-4 text-blue-400" />
                                    </div>
                                    <span className="text-lg text-gray-300">{item}</span>
                                </li>
                            ))}
                        </ul>
                        
                        <div className="mt-10">
                             <Link to="/signup" className="text-blue-400 font-medium hover:text-blue-300 flex items-center gap-2">
                                 Explore Use Cases <ChevronRight className="w-4 h-4" />
                             </Link>
                        </div>
                    </div>
                    <div className="relative">
                        <div className="aspect-square rounded-2xl overflow-hidden bg-gray-900/50 border border-white/10 p-6 flex items-center justify-center">
                            <div className="text-center">
                                <div className="text-6xl font-bold text-white/10 mb-2">AI</div>
                                <div className="text-sm text-gray-500">Universal Pose Recognition Model</div>
                            </div>
                        </div>
                        {/* Decorative elements */}
                        <div className="absolute -top-10 -right-10 w-32 h-32 bg-purple-500/30 rounded-full blur-2xl" />
                        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-blue-500/30 rounded-full blur-2xl" />
                    </div>
                </div>
            </div>
        </section>

        {/* CTA */}
        <section className="max-w-4xl mx-auto px-6 text-center">
            <h2 className="text-4xl font-bold mb-6">Ready to perfect your form?</h2>
            <p className="text-gray-400 mb-10 text-lg">Join thousands of users correcting their movement with AI.</p>
            <Link 
              to="/signup"
              className="inline-block px-12 py-5 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl text-lg font-bold hover:shadow-[0_0_40px_rgba(79,70,229,0.4)] transition-all transform hover:-translate-y-1"
            >
              Get Started for Free
            </Link>
        </section>

      </main>

      <footer className="border-t border-white/5 py-12 text-center text-gray-500 text-sm">
        <p>© 2026 SkillSync. AI Powered Biomechanics.</p>
      </footer>
    </div>
  )
}

export default LandingPage
