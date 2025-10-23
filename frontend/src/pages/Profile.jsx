// vite-project/src/pages/Profile.jsx
import React from 'react';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import { GridBackground } from '../components/lightswind/grid-dot-background';
import Navbar from '../components/Navbar';
import SpeedDial from '../components/SpeedDial';
import Cards from '../components/Cards';
import { motion } from 'framer-motion';
import UploadProofSection from '../components/UploadProofSection';
import UserDetailsCard from '../components/UserDetailsCard';
import ProgressBarGraph from '../components/ProgressBarGraph';

const planStats = [
  { label: "Planned Tasks", value: "12" },
  { label: "Completed Tasks", value: "9" },
  { label: "Delayed Tasks", value: "3" },
  { label: "Avg Completion Time", value: "1.8 days" },
  { label: "On-time Delivery Rate", value: "75%", color: "text-green-400" },
  { label: "Top Blocker", value: "Review Wait" },
  { label: "Next Sprint Goal", value: "Complete SH19 Tracker" },
  { label: "Team Performance", value: "8.4/10", color: "text-blue-500" },
  { label: "GPA", value: "8.4", color: "text-yellow-400" },
  { label: "Team GPA", value: "7.9", color: "text-green-500" },
  { label: "Total Tasks", value: "100" },
  { label: "Tasks in Progress", value: "5" },
  
];

const cardVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.5,
      ease: "easeOut",
    },
  }),
};

const ProgressBarComparison = ({ planned, completed }) => {
  const progressPercent = Math.min((completed / planned) * 100, 100);

  return (
    <div className="w-full max-w-md mx-auto space-y-4 text-[#f8f7ec]">
      <h3 className="text-lg font-semibold text-center">Plan vs Progress</h3>
      
      <div className="text-sm flex justify-between">
        <span>Planned Tasks: {planned}</span>
        <span>Completed: {completed}</span>
      </div>

      <div className="w-full bg-[#333] rounded-full h-6 relative overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-green-500 to-blue-500"
          style={{ width: `${progressPercent}%` }}
        ></div>
      </div>

      <p className="text-xs text-center text-gray-400">
        {progressPercent.toFixed(1)}% of tasks completed
      </p>
    </div>
  );
};


const Profile = () => {
  const reviews = [
    { from: 'Manager', text: 'Efficient this week.', sentiment: 'positive' },
    { from: 'Peer', text: 'Helpful but needs quicker reviews.', sentiment: 'neutral' },
  ];

  const autoSummary = 'Closed 9 tasks, delayed 3, top blocker: review wait';
  const clarityCoach = 'Your code reviews are consistently late — consider blocking time.';

  return (
    <GridBackground
      gridSize={24}
      gridColor="#e4e4e7"
      darkGridColor="#262626"
      showFade={true}
      fadeIntensity={30}
      className="min-h-screen px-6 py-12"
    >
      <div className="bg-[#181818] dark:bg-[#181818] rounded-3xl opacity-0.1">
      <div className="w-full flex justify-center ">
        <div className="flex items-start gap-4 p-4 mb-4 w-screen max-w-screen-xl">
          
          <div className="flex-1">
            <Navbar />
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6 "><div className="flex items-center justify-center h-16">
  <h3 className="text-6xl font-semibold text-[#f8f7ec] py-4">
    Plan vs Progress
  </h3>
</div>
        <div className="w-full py-20 px-6 sm:px-16 rounded-[48px] bg-white/5 
                border-none 
                shadow-[inset_0_1px_4px_rgba(255,255,255,0.1),0_8px_32px_rgba(0,0,0,0.35)]
                hover:scale-[1.01] hover:shadow-[0_0_30px_rgba(255,255,255,0.1)]
                transition-all duration-300 ease-out relative z-10">
                  
         <div className="flex flex-col sm:flex-row items-center sm:items-stretch justify-between gap-6 sm:gap-12">
          
  {/* Left Side - Double Ring */}
  <div className="flex-1 flex justify-center items-center h-[600px] sm:h-[600px]">
    
  <div className="w-full h-full">
    <ProgressBarGraph />
  </div>
</div>


  {/* Vertical Divider */}
  <div className="hidden sm:block w-px bg-[#f8f7ec]/30 mx-4"></div>

  {/* Right Side - Plan vs Progress */}
  <div className="flex-1 text-[#f8f7ec] bg-[#181818]/1.3 rounded-2xl shadow p-4 space-y-3">
    
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
  {planStats.map((item, i) => (
    <motion.div
      key={i}
      custom={i}
      initial="hidden"
      animate="visible"
      variants={cardVariants}
      className="bg-black/80 rounded-2xl p-4 transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_16px_rgba(255,255,255,0.1)] hover:bg-[#202020]"
    >
      <h3 className="text-md font-semibold text-[#f8f7ec]">{item.label}</h3>
      <p className={`mt-1 ${item.color || "text-[#f8f7ec]"}`}>{item.value}</p>
    </motion.div>
  ))}
</div>


  </div>
</div>

        </div>
        <div className="w-full py-20 px-6 sm:px-16 rounded-[48px] 
                
                
                hover:scale-[1.01] 
                transition-all duration-300 ease-out relative z-10">

                  <div className="flex w-full items-center rounded-full my-6">
                <div className="flex-1 border-b border-[#f8f7ec]"></div>
                <span className="text-[#f8f7ec] dark:text-[#f8f7ec] text-lg font-semibold leading-8 px-8 py-3">
                  Today
                </span>
                <div className="flex-1 border-b border-[#f8f7ec]"></div>
              </div>
        <Cards />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 max-w-6xl mx-auto  ">
          <div className="bg-black/80 rounded-2xl shadow p-4">
            <h3 className="text-lg text-[#f8f7ec] dark:text-[#f8f7ec] font-medium mb-2">What Others Say</h3>
            <ul className="space-y-2">
              {reviews.map((r, i) => (
                <li key={i} className="text-sm text-[#f8f7ec] dark:text-[#f8f7ec]">
                  <strong>{r.from}:</strong> {r.text}
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-black/80 rounded-2xl shadow p-4 flex flex-col justify-center">
            <h3 className="text-lg font-semibold text-[#f8f7ec] dark:text-[#f8f7ec] mb-2">Performance GPA</h3>
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-[#f8f7ec] dark:text-[#f8f7ec]">Your GPA</p>
                <p className="text-2xl font-bold text-blue-600">8.4</p>
              </div>
              <div>
                <p className="text-sm text-[#f8f7ec] dark:text-[#f8f7ec]">Team GPA</p>
                <p className="text-2xl font-bold text-green-600">7.9</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-6xl mx-auto mt-6">
          <div className="bg-black/80 rounded-2xl p-4">
            <h3 className="text-md font-semibold text-[#f8f7ec] dark:text-[#f8f7ec]">Auto Summary</h3>
            <p className="text-sm mt-1 text-[#f8f7ec] dark:text-[#f8f7ec]">{autoSummary}</p>
          </div>
          <div className="bg-black/80 rounded-2xl p-4">
            <h3 className="text-md font-semibold text-[#f8f7ec] dark:text-[#f8f7ec]">Friday Clarity Coach</h3>
            <p className="text-sm mt-1 text-[#f8f7ec] dark:text-[#f8f7ec]">{clarityCoach}</p>
          </div>
        </div>
 </div>
  <div className="flex w-full items-center rounded-full my-6">
                <div className="flex-1 border-b border-[#f8f7ec]"></div>
                
                <div className="flex-1 border-b border-[#f8f7ec]"></div>
              </div>
        <div className="w-full py-20 px-6 sm:px-16 rounded-[48px] bg-[#242424] 
  border-none 
  shadow-[inset_0_1px_4px_rgba(255,255,255,0.1),0_8px_32px_rgba(0,0,0,0.35)]
  hover:scale-[1.01] hover:shadow-[0_0_30px_rgba(255,255,255,0.1)]
  transition-all duration-300 ease-out relative overflow-hidden z-10"
>
  <div className="flex flex-row gap-6 justify-center items-start">
    
    {/* Team Details */}
    <div className="bg-[#181818] rounded-2xl shadow p-4 w-full sm:w-[300px] hover:bg-[#202020] transition-all duration-300">
      <h3 className="text-lg text-[#f8f7ec] font-bold mb-2">Team Details</h3>
      <ul className="text-sm text-[#f8f7ec] space-y-1">
        <li><strong>Team:</strong> Velocity Hackers</li>
        <li><strong>Members:</strong> Fresh, Akash, Nihal</li>
        <li><strong>Current Task:</strong> SH19 RealPace Tracker</li>
      </ul>
    </div>

    {/* User Details */}
   <UserDetailsCard />

    {/* Leaderboard */}
    <div className="bg-[#181818] rounded-2xl shadow p-4 w-full sm:w-[300px] hover:bg-[#202020] transition-all duration-300">
      <h3 className="text-lg text-[#f8f7ec] font-bold mb-2">Leaderboard</h3>
      <ol className="text-sm text-[#f8f7ec] space-y-1 list-decimal list-inside">
        <li><span className="font-medium">Fresh</span> — 86 pts</li>
        <li><span className="font-medium">Akash</span> — 74 pts</li>
        <li><span className="font-medium">Nihal</span> — 68 pts</li>
      </ol>
    </div>
</div>
    {/* Upload Proof Section */}
    <div className="flex-1 min-w-[300px] max-w-full h-full overflow-hidden">
      <UploadProofSection />
    </div>
    
  
</div>

        </div>
        
      </div>
      
     
    </GridBackground>
  );
};

export default Profile;