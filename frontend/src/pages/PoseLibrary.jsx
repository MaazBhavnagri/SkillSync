"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { useNavigate } from "react-router-dom"
import { Search, Upload, ArrowRight, Activity, Heart, Dumbbell, Play } from "lucide-react"
import poseLibrary from "../data/poseLibrary.json"

const CategoryIcon = ({ category }) => {
  switch (category) {
    case "yoga":
      return <Activity className="w-5 h-5 text-purple-500" />
    case "physio":
      return <Heart className="w-5 h-5 text-red-500" />
    case "rehab":
      return <Dumbbell className="w-5 h-5 text-blue-500" />
    default:
      return <Activity className="w-5 h-5" />
  }
}

const PoseCard = ({ pose, category, onClick }) => {
  return (
    <motion.div
      whileHover={{ y: -5, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-lg border border-gray-100 dark:border-gray-700 cursor-pointer group"
      onClick={onClick}
    >
      <div className="relative aspect-square overflow-hidden bg-gray-100 dark:bg-gray-900">
        {pose.type === 'video' ? (
          <video
            src={pose.image}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            muted
            loop
            playsInline
            autoPlay
          />
        ) : (
          <img
            src={pose.image}
            alt={pose.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            onError={(e) => {
              e.target.style.display = 'none'; 
              e.target.nextSibling.style.display = 'flex';
            }}
          />
        )}
        {/* Fallback pattern if image missing */}
        <div className="absolute inset-0 hidden items-center justify-center bg-gray-100 dark:bg-gray-800 text-gray-400">
          <Activity className="w-12 h-12 opacity-20" />
        </div>
        
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
          <span className="text-white text-sm font-medium flex items-center gap-2">
            Practice Now <ArrowRight className="w-4 h-4" />
          </span>
        </div>
        
        <div className="absolute top-3 right-3 flex gap-2">
          {pose.type === 'video' && (
             <div className="w-6 h-6 rounded-full bg-white/90 dark:bg-black/80 flex items-center justify-center shadow-sm">
                <Play className="w-3 h-3 text-blue-600 fill-blue-600" />
             </div>
          )}
          <span className="px-2 py-1 bg-white/90 dark:bg-black/80 backdrop-blur-sm rounded-md text-xs font-semibold text-gray-800 dark:text-gray-200 shadow-sm border border-gray-200 dark:border-gray-600">
            {category.charAt(0).toUpperCase() + category.slice(1)}
          </span>
        </div>
      </div>
      
      <div className="p-4">
        <h3 className="font-bold text-gray-900 dark:text-white mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
          {pose.name}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-3">
          {pose.description}
        </p>
        <div className="flex items-center justify-between text-xs text-gray-400 dark:text-gray-500">
            <span className="px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700">
                {pose.difficulty || 'General'}
            </span>
        </div>
      </div>
    </motion.div>
  )
}

const PoseLibrary = () => {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState("")
  const [activeCategory, setActiveCategory] = useState("all")

  // Flatten poses for search
  const allPoses = Object.entries(poseLibrary).flatMap(([category, poses]) =>
    poses.map(pose => ({ ...pose, category }))
  )

  const filteredPoses = allPoses.filter(pose => {
    const matchesSearch = pose.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = activeCategory === "all" || pose.category === activeCategory
    return matchesSearch && matchesCategory
  })

  // Group filtered poses by category for display if viewing "all"
  const displayGroups = activeCategory === "all" 
    ? Object.keys(poseLibrary).filter(cat => filteredPoses.some(p => p.category === cat))
    : [activeCategory]

  const handlePoseClick = (pose) => {
    navigate("/video-comparison", {
      state: {
        referenceImage: pose.image, // Keep for backward compat, but logic prefers reference or handles it
        reference: pose.reference || pose.image, // "reference" is new standard
        poseName: pose.name,
        mode: "static",
        type: pose.type || "image",
        defaultSpeed: pose.defaultSpeed,
        userAdjustableSpeed: pose.userAdjustableSpeed
      }
    })
  }

  const handleCustomUpload = () => {
    navigate("/video-comparison", { state: { mode: "upload" } }) // No image state forces upload prompt
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 px-4 sm:px-6 lg:px-8 py-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            Pose Library
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Browse our collection of reference poses or upload your own to start practicing with real-time AI feedback.
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white dark:bg-gray-900 p-4 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800">
            {/* Categories */}
            <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto no-scrollbar">
                <button
                    onClick={() => setActiveCategory("all")}
                    className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                        activeCategory === "all" 
                            ? "bg-blue-600 text-white shadow-md shadow-blue-500/20" 
                            : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                    }`}
                >
                    All Poses
                </button>
                {Object.keys(poseLibrary).map(cat => (
                     <button
                     key={cat}
                     onClick={() => setActiveCategory(cat)}
                     className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap capitalize transition-all ${
                         activeCategory === cat
                             ? "bg-blue-600 text-white shadow-md shadow-blue-500/20" 
                             : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                     }`}
                 >
                     {cat}
                 </button>
                ))}
            </div>

            {/* Search */}
            <div className="relative w-full md:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                    type="text"
                    placeholder="Search poses..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                />
            </div>
        </div>

        {/* Custom Upload Card (Always visible or in a prominent place) */}
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
        >
             <div 
                onClick={handleCustomUpload}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white shadow-lg cursor-pointer hover:shadow-xl hover:scale-[1.01] transition-all relative overflow-hidden group"
             >
                <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-white/20 rounded-full backdrop-blur-sm">
                            <Upload className="w-8 h-8 text-white" />
                        </div>
                        <div className="text-center sm:text-left">
                            <h3 className="text-xl font-bold">Custom Pose</h3>
                            <p className="text-blue-100 opacity-90">Upload any photo or video reference to practice.</p>
                        </div>
                    </div>
                    <button className="px-6 py-2 bg-white text-blue-600 font-semibold rounded-lg shadow-sm group-hover:bg-blue-50 transition-colors">
                        Upload Now
                    </button>
                </div>
                {/* Background Decor */}
                <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-all duration-700" />
            </div>
        </motion.div>

        {/* Pose Grid */}
        <div className="space-y-10">
          {displayGroups.map(category => {
             const categoryPoses = filteredPoses.filter(p => p.category === category);
             if (categoryPoses.length === 0) return null;

             return (
                 <div key={category} className="space-y-4">
                     <div className="flex items-center gap-3 border-b border-gray-200 dark:border-gray-800 pb-2">
                         <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                             <CategoryIcon category={category} />
                         </div>
                         <h2 className="text-2xl font-bold text-gray-900 dark:text-white capitalize">
                             {category}
                         </h2>
                     </div>
                     
                     <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                         {categoryPoses.map((pose) => (
                             <PoseCard 
                                 key={pose.id} 
                                 pose={pose} 
                                 category={category}
                                 onClick={() => handlePoseClick(pose)}
                             />
                         ))}
                     </div>
                 </div>
             )
          })}
          
          {filteredPoses.length === 0 && (
            <div className="text-center py-20">
                <div className="bg-gray-100 dark:bg-gray-800 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No poses found</h3>
                <p className="text-gray-500">Try adjusting your search or category filter.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default PoseLibrary
