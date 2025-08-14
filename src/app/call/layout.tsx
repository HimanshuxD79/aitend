interface Props {
  children: React.ReactNode;
}

const Layout = ({ children }: Props) => {
  return (
    <div className="min-h-screen h-screen w-full bg-gray-900">{children}</div>
  );
};
export default Layout;
