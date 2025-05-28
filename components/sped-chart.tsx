"use client"

import { useEffect, useRef, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useTheme } from "next-themes"

interface SpedChartProps {
  data: {
    labels: string[]
    datasets: {
      label: string
      data: number[]
      backgroundColor?: string
      borderColor?: string
    }[]
  }
  title: string
}

export function SpedChart({ data, title }: SpedChartProps) {
  const chartRef = useRef<HTMLCanvasElement>(null)
  const chartInstance = useRef<any>(null)
  const { theme } = useTheme()
  const [chartLoaded, setChartLoaded] = useState(false)

  useEffect(() => {
    // Dynamically import Chart.js to avoid SSR issues
    const initChart = async () => {
      try {
        if (!chartRef.current) {
          console.error("Canvas element not found")
          return
        }

        // Wait for next tick to ensure DOM is ready
        await new Promise((resolve) => setTimeout(resolve, 0))

        const { Chart, registerables } = await import("chart.js")
        Chart.register(...registerables)

        // Destroy previous chart if it exists
        if (chartInstance.current) {
          chartInstance.current.destroy()
        }

        // Set colors based on theme
        const isDark = theme === "dark"
        const textColor = isDark ? "#e5e7eb" : "#374151"
        const gridColor = isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)"

        // Create new chart
        const ctx = chartRef.current.getContext("2d")
        if (!ctx) {
          console.error("Could not get 2d context from canvas")
          return
        }

        chartInstance.current = new Chart(ctx, {
          type: "bar",
          data: {
            ...data,
            datasets: data.datasets.map((dataset) => ({
              ...dataset,
              backgroundColor:
                dataset.backgroundColor || (isDark ? "rgba(59, 130, 246, 0.7)" : "rgba(59, 130, 246, 0.7)"),
              borderColor: dataset.borderColor || (isDark ? "rgba(59, 130, 246, 1)" : "rgba(59, 130, 246, 1)"),
              borderWidth: 1,
            })),
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: "top",
                labels: {
                  color: textColor,
                },
              },
              tooltip: {
                mode: "index",
                intersect: false,
              },
            },
            scales: {
              y: {
                beginAtZero: true,
                grid: {
                  color: gridColor,
                },
                ticks: {
                  color: textColor,
                },
              },
              x: {
                grid: {
                  color: gridColor,
                },
                ticks: {
                  color: textColor,
                },
              },
            },
          },
        })

        setChartLoaded(true)
      } catch (error) {
        console.error("Error initializing chart:", error)
      }
    }

    // Use a small delay to ensure the DOM is fully rendered
    const timer = setTimeout(() => {
      initChart()
    }, 100)

    // Cleanup
    return () => {
      clearTimeout(timer)
      if (chartInstance.current) {
        chartInstance.current.destroy()
      }
    }
  }, [data, theme])

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] relative">
          {!chartLoaded && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 border-4 border-t-blue-600 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
            </div>
          )}
          <canvas ref={chartRef} />
        </div>
      </CardContent>
    </Card>
  )
}
