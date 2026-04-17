"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";

const STORIES = [
  {
    id: 1,
    title: "HUBTrade",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuC7KjFzPbRm68Q-pUXfOg5QrVlcESBEnEYYx5ewMvA3f88ysCED3JMVQ2-onOaOWBdTTxM6iVCnjURk3_0S64v5_ZoLgPmVDDnmliYLdnSyQB9PHzCxEbFwjXixpsmLq-08J497MIkhtQdhUFQAqOWlzAkkKiH5hx2tO-glUrNGn8bjVRI--3GRQTduS6M7s72LklnVCgP3vCt6Hn7fj7G4VHCcsN7SzLxLuzjpT8dAhgJguaKCbGs3W3j-6SwYXDT6E2I7NMQeEoLH",
    link: "/onboarding/step-1",
  },
  {
    id: 2,
    title: "Фильтры",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAvnyGwZDAhhJKQ0zyEtjabpQcGhLB-rcQsSQCUHqwJxVhe9J271HlaCgVsVe84KDM3pvjq25DMPg2a6DDb4DTb8lAqRQ-iuLOoq3T7QUfGhOQkj70Exxgyq-UgQZwK-CSsw2kJfnESNaAuv8bqeKHxR7CkXz7dYlTw1e6jD1ZMBp8uVrv8eDQBfklLmRHKwZupt1tk0v--8aW6WC59eD20Aidur2C6RAQSV9ZbOISL24Y-QErcoMSDaacj15hDXYqK3l8ZuCXHmD6T",
    link: "/onboarding/step-2",
  },
  {
    id: 3,
    title: "Детали",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuB4Kos9iCK94LhvSfijt6Lit-NrdkkFUZcMncb4r5ugMht6wxveps81JrxLD1SaYaAelJ9M7gT4Qr3FPey_ToFmBsfIHj3oYMxusPNfLytVh20dF76RxPK1yRofQCA55BkS3Fo2fyq1wyCEfUBB-RJaOIG32JzM0l8IT9B-axG3lKG6e4pT19FoBPhAwsqznLM8dTt5gWb7ULBkmAN_NhqPfqMDHNNGvua_gIO1eus-YY88Wz0vQt31FIgQldrbSZ4gr_2I1vMyFrZm",
    link: "/onboarding/step-3",
  },
  {
    id: 4,
    title: "Трекинг",
    image: "https://images.unsplash.com/photo-1524661135-423995f22d0b?q=80&w=2074&auto=format&fit=crop",
    link: "/onboarding/step-4",
  },
  {
    id: 5,
    title: "Поддержка",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCz4rB_D33gCTsU8FfkGg3L44rFIHqMDFECz1jUXzfe-5DcO8avhwk0WxVnzmRrF9IOhDQwEmEWHRvm9Ln3dwk9xBLPVkNP_eaGL_S_nS8sRAMWOsaBavcFDOEufTVX38iKGC2uxg8GbQbF205MaUQQlakUmKpjTDRuz6TftZHm2zLZzPB11lVgZSfEE_b8backSxdMj6ZTsl1XOjwww1B1vdxFIYKhRTIyotp_AIxZQsAwEQ2Z2PFxHG8Aff1NADyc_l3IdVafYZ7a",
    link: "/onboarding/step-5",
  },
  {
    id: 6,
    title: "В каталог",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuATG6kEJQlePJCwAwF2Trr1XX62dxf062gmlB1odlpufHX90ngu6aQ1QNvQxdwyIcDUvgF9t0YjyWgUFkF5sxK9CmA_uQNQoafmdzx-h2vkyJyVWigplJDaTmQNLc9Ot5a7Q_Lm9vDai6lNXt8WS1vVNckjT9chEI7bRoIckXmLl9l9UsfhVXMAUqBd-2qmvViQmrZztiUzDdeJSUK0afJI9wdnE_qDA8mn8l1hQTYEcDQzWkZXGHnbFpdpmoHKWAFZIXiHZ0EM0AfK",
    link: "/onboarding/step-6",
  },
];

export function QuickStories() {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Hidden scrollbar utilities combined into inline style for simplicity without external CSS changes
  return (
    <div className="w-full mt-4 mb-2">
      <div 
        ref={scrollRef}
        className="flex overflow-x-auto gap-4 px-4 pb-2 items-start"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        <style dangerouslySetInnerHTML={{__html: `::-webkit-scrollbar { display: none; }`}} />
        
        {STORIES.map((story) => (
          <Link href={story.link} key={story.id} className="flex flex-col items-center gap-2 flex-shrink-0 group">
            <div className="w-16 h-16 rounded-full p-[2px] bg-gradient-to-tr from-primary to-primary-container group-hover:scale-105 transition-transform duration-200">
              <div className="w-full h-full rounded-full border-2 border-background overflow-hidden relative">
                <Image
                  src={story.image}
                  alt={story.title}
                  fill
                  className="object-cover"
                  sizes="64px"
                />
              </div>
            </div>
            <span className="text-[10px] font-medium text-on-surface text-center font-label max-w-[70px] truncate">
              {story.title}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
