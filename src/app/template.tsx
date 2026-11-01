/* 路由切换：每次导航 template 重新挂载，触发幕布与内容入场动画 */
export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="route-curtain" aria-hidden />
      <div className="route-enter">{children}</div>
    </>
  );
}
