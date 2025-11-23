import React, { useState, useEffect } from "react";

const Onboarding = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const hasVisited = localStorage.getItem("routeguide_visited");
    if (!hasVisited) {
      setIsVisible(true);
    }
  }, []);

  const handleDismiss = () => {
    localStorage.setItem("routeguide_visited", "true");
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 transform transition-all scale-100 animate-scale-in">
        <div className="text-center mb-6">
          <div className="text-4xl mb-3">👋</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Welcome to RouteGuide!
          </h2>
          <p className="text-gray-600">
            Plan your perfect trip in 3 simple steps:
          </p>
        </div>

        <div className="space-y-4 mb-8">
          <div className="flex items-start gap-4 p-3 rounded-xl bg-blue-50 border border-blue-100">
            <div className="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold flex-shrink-0">
              1
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Enter route</h3>
              <p className="text-sm text-gray-600">
                Pick start and destination (e.g. Munich → Nuremberg).
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-3 rounded-xl bg-indigo-50 border border-indigo-100">
            <div className="bg-indigo-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold flex-shrink-0">
              2
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Choose places</h3>
              <p className="text-sm text-gray-600">
                Select categories and find interesting spots along the way.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-3 rounded-xl bg-green-50 border border-green-100">
            <div className="bg-green-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold flex-shrink-0">
              3
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Add to trip</h3>
              <p className="text-sm text-gray-600">
                Select your favorites and open them directly in Google Maps.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={handleDismiss}
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors shadow-lg hover:shadow-blue-300 transform hover:-translate-y-0.5"
        >
          Got it, let's go!
        </button>
      </div>
    </div>
  );
};

export default Onboarding;
