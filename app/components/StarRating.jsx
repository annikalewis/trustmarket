'use client'

import { useState } from 'react'

export default function StarRating({ onRate, disabled = false }) {
  const [hoverRating, setHoverRating] = useState(0)
  const [selectedRating, setSelectedRating] = useState(0)

  const labels = {
    0: '',
    0.5: 'Poor',
    1: 'Poor',
    1.5: 'Fair',
    2: 'Fair',
    2.5: 'Good',
    3: 'Good',
    3.5: 'Great',
    4: 'Great',
    4.5: 'Excellent',
    5: 'Excellent'
  }

  const handleStarClick = (index, isRightHalf) => {
    if (disabled) return
    const rating = isRightHalf ? index + 1 : index + 0.5
    setSelectedRating(rating)
    onRate(rating)
  }

  const handleStarHover = (index, isRightHalf) => {
    if (disabled) return
    const rating = isRightHalf ? index + 1 : index + 0.5
    setHoverRating(rating)
  }

  const displayRating = hoverRating || selectedRating

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex gap-2 items-center">
        {[0, 1, 2, 3, 4].map((index) => (
          <div
            key={index}
            className="relative text-4xl cursor-pointer group"
            onMouseLeave={() => setHoverRating(0)}
          >
            {/* Left half (0.5 star) */}
            <div
              className="absolute left-0 top-0 w-1/2 h-full overflow-hidden cursor-pointer"
              onClick={() => handleStarClick(index, false)}
              onMouseMove={() => handleStarHover(index, false)}
            >
              <span
                className={`transition-all ${
                  displayRating >= index + 0.5
                    ? 'text-yellow-400'
                    : 'text-gray-300'
                }`}
              >
                ★
              </span>
            </div>

            {/* Right half (full star) */}
            <div
              className="relative w-full h-full cursor-pointer"
              onClick={() => handleStarClick(index, true)}
              onMouseMove={() => handleStarHover(index, true)}
            >
              <span
                className={`transition-all ${
                  displayRating > index + 0.5
                    ? 'text-yellow-400'
                    : 'text-gray-300'
                }`}
              >
                ★
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="text-center">
        <div className="text-2xl font-bold text-gray-900">
          {displayRating > 0 ? `${displayRating}★` : 'Select a rating'}
        </div>
        {displayRating > 0 && (
          <div className="text-sm text-gray-600 mt-1">
            {labels[displayRating]}
          </div>
        )}
      </div>
    </div>
  )
}
