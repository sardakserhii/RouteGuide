import React, { useState } from "react";

interface PoiImageProps {
    imageUrl?: string;
    alt?: string;
}

export const PoiImage: React.FC<PoiImageProps> = ({ imageUrl, alt }) => {
    const [isLoaded, setIsLoaded] = useState(false);

    if (!imageUrl) return null;

    return (
        <div
            className={`${
                isLoaded ? "block" : "hidden"
            } w-24 h-24 bg-gray-100 rounded-xl shrink-0 overflow-hidden relative shadow-inner`}
        >
            <img
                src={imageUrl}
                alt={alt}
                loading="lazy"
                className="w-full h-full object-cover"
                onLoad={() => setIsLoaded(true)}
                onError={(e) => {
                    // Ensure it stays hidden if error occurs after load (unlikely but possible) or just doesn't load
                    e.currentTarget.style.display = "none";
                }}
            />
        </div>
    );
};
