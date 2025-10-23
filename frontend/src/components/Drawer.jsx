import { useState } from "react";
import { X } from "lucide-react";

const Drawer = () => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleDrawer = () => setIsOpen(!isOpen);

  return (
    <>
      <div className="text-center h-[800px]">
        <button
          onClick={toggleDrawer}
          className="drawer-button py-2.5 px-5 text-xs bg-indigo-500 text-white rounded-full cursor-pointer font-semibold text-center shadow-xs transition-all duration-500 hover:bg-indigo-700"
        >
          Show drawer Left
        </button>
      </div>

      <div
        className={`fixed top-0 left-0 z-40 w-96 h-full bg-white shadow transition-transform duration-300 overflow-y-auto ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="pl-9 pr-3 pb-11">
          <div className="flex justify-between items-center pt-6 pr-2.5">
            <div>
              <h2 className="text-gray-900 text-lg font-semibold leading-7">Notification</h2>
              <p className="text-black text-opacity-20 text-sm font-normal leading-snug">
                Drawer notification panel
              </p>
            </div>
            <button
              onClick={toggleDrawer}
              className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm w-8 h-8 inline-flex items-center justify-center"
            >
              <X className="w-4 h-4" />
              <span className="sr-only">Close menu</span>
            </button>
          </div>

          {/* 🔔 Notification items */}
          <div className="py-6 space-y-4">
            {[
              {
                img: "https://pagedone.io/asset/uploads/1704349514.png",
                name: "Hailey Garza",
                action: "added new tags to Ease Design System",
                time: "Account | Friday, 10:03 AM",
              },
              {
                img: "https://pagedone.io/asset/uploads/1704351103.png",
                name: "Brandon Newman",
                action: "Liked your Pagedone 045-favourites-2h ago",
                time: "Friday, 10:03 AM",
              },
              {
                img: "https://pagedone.io/asset/uploads/1705646315.png",
                name: "Justi Bolt",
                action: "Started Following",
                time: "Friday, 10:03 AM",
              },
              {
                img: "https://pagedone.io/asset/uploads/1705646299.png",
                name: "Dave Wood",
                action: "Started Following",
                time: "Friday, 10:03 AM",
              },
            ].map((item, index) => (
              <div className="flex gap-3" key={index}>
                <img src={item.img} alt={item.name} className="w-12 h-12 rounded-full" />
                <div>
                  <h5 className="text-gray-900 text-sm font-medium leading-snug mb-1">
                    {item.name}{" "}
                    <span className="text-gray-500">{item.action}</span>
                  </h5>
                  <h6 className="text-gray-500 text-xs font-normal leading-[18px]">{item.time}</h6>
                </div>
              </div>
            ))}

            <h2 className="text-gray-900 text-base font-semibold leading-relaxed mb-4 mt-6">This Week</h2>

            {/* Additional Items */}
            <div className="space-y-4">
              {/* Repeat similar structure */}
              {/* Example */}
              <div className="flex gap-3">
                <img src="https://pagedone.io/asset/uploads/1705647084.png" alt="Natasha" className="w-12 h-12 rounded-full" />
                <div className="flex flex-col">
                  <div className="pb-3">
                    <h5 className="text-gray-900 text-sm font-medium leading-snug mb-1">
                      Natasha <span className="text-gray-500">sent you competitors analysis document</span>
                    </h5>
                    <h6 className="text-gray-500 text-xs font-normal leading-[18px]">Friday, 10:03 AM</h6>
                  </div>
                  <div className="flex gap-1 p-3 bg-gray-50 rounded-lg w-fit">
                    <svg
                      width="34"
                      height="34"
                      viewBox="0 0 34 34"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M26.9018 9.01473L27.4998 8.48324M24.3571 6.15194L23.7592 6.68343M22.5548 4.49865L22.2271 5.22845M28.1482 10.6953L27.4004 10.9796M27.0884 28.5052L27.6541 29.0709"
                        stroke="#6B7280"
                      />
                    </svg>
                    <div>
                      <h5 className="text-gray-900 text-xs font-medium leading-4 pb-0.5">
                        Competitors analysis
                      </h5>
                      <h6 className="text-gray-500 text-xs font-normal leading-4">56 Mb</h6>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Drawer;
