import clsx from 'clsx';

export default function Card({ className, ...props }) {
  return <section className={clsx('rounded-lg border border-line bg-white shadow-soft', className)} {...props} />;
}
