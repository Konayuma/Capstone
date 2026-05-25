import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import CoolLoader from '../components/CoolLoader';
import { ArrowRight, KeyRound } from 'lucide-react';

const JoinProject = () => {
  const { code } = useParams();
  const navigate = useNavigate();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const joinProject = async () => {
      try {
        const res = await axios.post(`/projects/join/${code}`);
        setResult(res.data);
        toast.success(`Joined ${res.data.project.title}. You can open the team workspace now.`);
      } catch (err) {
        toast.error(err.response?.data?.error || 'This invite code is invalid or expired.');
      } finally {
        setLoading(false);
      }
    };

    joinProject();
  }, [code]);

  if (loading) {
    return <CoolLoader title="Verifying invite code" subtitle="Adding you to the project workspace..." />;
  }

  return (
    <div className="join-page">
      <section className="card join-card">
        <span className="badge badge-info">
          <KeyRound size={14} />
          Invite code
        </span>
        <h1>{result ? 'You are on the team' : 'Invite could not be accepted'}</h1>
        <p>
          {result
            ? `You joined ${result.project.title}. Open the workspace to see members, tasks, and files.`
            : 'That invite code is no longer usable. Ask the project lead for a fresh one.'}
        </p>
        <button
          className="btn btn-primary"
          onClick={() => navigate(result ? `/projects/${result.project.id}#team` : '/dashboard')}
        >
          {result ? 'Open team workspace' : 'Return to dashboard'}
          <ArrowRight size={16} />
        </button>
      </section>
    </div>
  );
};

export default JoinProject;
