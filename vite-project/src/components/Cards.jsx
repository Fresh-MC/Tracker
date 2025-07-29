import React from 'react';

function Cards() {
  return (
    // Card Section
    <div className="max-w-[85rem] px-4 py-10 sm:px-6 lg:px-8 lg:py-14 mx-auto">
      {/* Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        
        {/* Card 1 - Projects */}
        <Card
          dotColor="bg-gray-500"
          title="Projects"
          value="150"
          change="1.7%"
          changeColor="text-green-600"
          iconUp={true}
          delta="5"
          deltaLabel="last week"
        />

        {/* Card 2 - Successful Conversions */}
        <Card
          dotColor="bg-green-500"
          title="Successful conversions"
          value="25"
          change="5.6%"
          changeColor="text-green-600"
          iconUp={true}
          delta="7"
          deltaLabel="last week"
        />

        {/* Card 3 - Failed Conversions */}
        <Card
          dotColor="bg-red-500"
          title="Failed conversions"
          value="4"
          change="5.6%"
          changeColor="text-red-600"
          iconUp={false}
          delta="7"
          deltaLabel="last week"
        />

      </div>
    </div>
  );
}

// 🧱 Reusable Card Component
function Card({ dotColor, title, value, change, changeColor, iconUp, delta, deltaLabel }) {
  return (
    <div className="flex flex-col gap-y-3 lg:gap-y-5 p-4 md:p-5 bg-black/60 border border-[#181818] shadow-2xs rounded-2xl">
      <div className="inline-flex justify-center items-center">
        <span className={`size-2 inline-block ${dotColor} rounded-full me-2`}></span>
        <span className="text-xs font-semibold uppercase tracking-wide text-[#f8f7ec] dark:text-[#f8f7ec]">{title}</span>
      </div>

      <div className="text-center">
        <h3 className="text-3xl sm:text-4xl lg:text-5xl font-semibold text-[#f8f7ec] dark:text-[#f8f7ec]">
          {value}
        </h3>
      </div>

      <dl className="flex justify-center items-center divide-x divide-gray-200">
        <dt className="pe-3">
          <span className={`${changeColor}`}>
            {iconUp ? (
              <svg className="inline-block size-4 self-center" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 16">
                <path fillRule="evenodd" d="m7.247 4.86-4.796 5.481c-.566.647-.106 1.659.753 1.659h9.592a1 1 0 0 0 .753-1.659l-4.796-5.48a1 1 0 0 0-1.506 0z" />
              </svg>
            ) : (
              <svg className="inline-block size-4 self-center" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 16">
                <path fillRule="evenodd" d="M7.247 11.14 2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z" />
              </svg>
            )}
            <span className="inline-block text-sm ms-1">{change}</span>
          </span>
          <span className="block text-sm text-[#f8f7ec] dark:text-[#f8f7ec]">change</span>
        </dt>
        <dd className="text-start ps-3">
          <span className="text-sm font-semibold text-[#f8f7ec] dark:text-[#f8f7ec]">{delta}</span>
          <span className="block text-sm text-[#f8f7ec] dark:text-[#f8f7ec]">{deltaLabel}</span>
        </dd>
      </dl>
    </div>
  );
}
export default Cards;
