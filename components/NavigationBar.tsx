"use client";

import Link from "next/link";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger
} from "@/components/ui/navigation-menu";
import { cn } from "@/lib/utils";
import { ReactNode, useState, useEffect } from "react";

const baseNavigationItems: {
  [key: string]: { link: string; subItems?: { name: string; link: string }[] };
} = {
  "관리자 페이지": { link: "" },
  재정: {
    link: "/finance",
    subItems: [
      { name: "신청자 명단", link: "" },
      { name: "신청 변동", link: "" }
    ]
  },
  라인업: {
    link: "/products",
    subItems: [
      { name: "리더 관리", link: "/products/all" },
      { name: "조원 배정", link: "/products/add" },
      { name: "조원 정보 입력", link: "/products/categories" }
    ]
  },
  "인원 관리": {
    link: "/orders",
    subItems: [
      { name: "숙소 등록 및 관리", link: "/orders/all" },
      { name: "숙소 배정", link: "/orders/pending" },
      { name: "Completed Orders", link: "/orders/completed" }
    ]
  }
};

export default function NavigationBar() {
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [navigationItems, setNavigationItems] = useState(baseNavigationItems);

  useEffect(() => {
    const retreatId = window.location.pathname.split('/')[2];
    const updatedItems = {...baseNavigationItems};
    if (retreatId) {
      updatedItems.재정.subItems = [
        { name: "신청자 명단", link: `/retreats/${retreatId}/finance/check-deposit` },
        { name: "신청 변동", link: `/retreats/${retreatId}/finance/modify-registration` }
      ];
    }
    setNavigationItems(updatedItems);
  }, []);

  return (
    <header className="border-b">
      <div className="container mx-auto px-4">
        <NavigationMenu>
          <NavigationMenuList>
            {Object.entries(navigationItems).map(([key, value]) => (
              <NavigationMenuItem key={key}>
                {value.subItems ? (
                  <>
                    <NavigationMenuTrigger
                      onClick={() => setActiveTab(key)}
                      className={cn(
                        activeTab === key && "bg-accent text-accent-foreground"
                      )}
                    >
                      {key}
                    </NavigationMenuTrigger>
                    <NavigationMenuContent>
                      <ul className="grid w-[400px] gap-3 p-4">
                        {value.subItems.map((item) => (
                          <ListItem
                            key={item.name}
                            title={item.name}
                            href={item.link}
                            className={""}
                          />
                        ))}
                      </ul>
                    </NavigationMenuContent>
                  </>
                ) : (
                  <Link href={value.link} legacyBehavior passHref>
                    <NavigationMenuLink
                      onClick={() => setActiveTab(key)}
                      className={cn(
                        "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus:outline-none focus:bg-accent focus:text-accent-foreground disabled:opacity-50 disabled:pointer-events-none bg-background hover:bg-accent hover:text-accent-foreground h-10 py-2 px-4 group w-max",
                        activeTab === key && "bg-accent text-accent-foreground"
                      )}
                    >
                      {key}
                    </NavigationMenuLink>
                  </Link>
                )}
              </NavigationMenuItem>
            ))}
          </NavigationMenuList>
        </NavigationMenu>
      </div>
    </header>
  );
}

const ListItem = ({
  className,
  title,
  href,
  ...props
}: {
  className: string;
  title: string;
  href: string;
}) => {
  return (
    <li>
      <NavigationMenuLink asChild>
        <Link
          href={href}
          className={cn(
            "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
            className
          )}
          {...props}
        >
          <div className="text-sm font-medium leading-none">{title}</div>
        </Link>
      </NavigationMenuLink>
    </li>
  );
};
