import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaClock,
  FaMapMarkerAlt,
  FaStar,
  FaTicketAlt,
} from "react-icons/fa";
import { FiCalendar, FiChevronDown } from "react-icons/fi";
import Loading from "../components/Loading";
import { API_ENDPOINTS } from "../config/api";
import "../styles/Showtimes.css";

const FALLBACK_POSTER =
  "https://via.placeholder.com/360x540?text=CinemaHub";
const FALLBACK_CITY = "Kh\u00E1c";

const getDateKey = (value) => {
  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return "";
  }

  return parsed.toISOString().split("T")[0];
};

const getFallbackDateKeys = (days = 7) => {
  const dates = [];
  const baseDate = new Date();
  baseDate.setHours(0, 0, 0, 0);

  for (let index = 0; index < days; index += 1) {
    const date = new Date(baseDate);
    date.setDate(baseDate.getDate() + index);
    dates.push(date.toISOString().split("T")[0]);
  }

  return dates;
};

const formatTime = (value) => {
  if (typeof value === "string" && value.trim()) {
    const normalized = value.trim().slice(0, 5);

    if (/^\d{2}:\d{2}$/.test(normalized)) {
      return normalized;
    }
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return "--:--";
  }

  return parsed.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatDateOption = (dateKey) => {
  const parsed = new Date(`${dateKey}T00:00:00`);

  if (Number.isNaN(parsed.getTime())) {
    return {
      value: dateKey,
      topLabel: "Ng\u00E0y",
      bottomLabel: dateKey,
    };
  }

  const todayKey = getDateKey(new Date());
  const weekdayLabel = parsed
    .toLocaleDateString("vi-VN", { weekday: "short" })
    .replace(".", "")
    .toUpperCase();
  const monthLabel = parsed.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
  });

  return {
    value: dateKey,
    topLabel: dateKey === todayKey ? "H\u00F4m nay" : weekdayLabel,
    bottomLabel: monthLabel,
  };
};

const getAgeTagClass = (ageRating) => {
  const normalized = (ageRating || "K").toLowerCase();

  if (normalized === "t13") {
    return "t13";
  }

  if (normalized === "t16") {
    return "t16";
  }

  if (normalized === "t18") {
    return "t18";
  }

  return "k";
};

const CustomSelect = ({ icon, label, value, options, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!wrapperRef.current?.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const selectedOption =
    options.find((option) => option.value === value) || options[0] || null;

  return (
    <div
      ref={wrapperRef}
      className={`showtimes-filter ${isOpen ? "open" : ""}`}
    >
      <span className="showtimes-filter-icon">{icon}</span>
      <span className="showtimes-filter-content">
        <span className="showtimes-filter-name">{label}</span>

        <button
          type="button"
          className="showtimes-select-trigger"
          onClick={() => setIsOpen((current) => !current)}
          aria-expanded={isOpen}
        >
          <span className="showtimes-select-value">
            {selectedOption?.label || ""}
          </span>
          <span className="showtimes-select-arrow" aria-hidden="true">
            <FiChevronDown />
          </span>
        </button>

        {isOpen && (
          <div className="showtimes-select-menu">
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                className={`showtimes-select-option ${
                  option.value === value ? "active" : ""
                }`}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
              >
                {option.label}
              </button>
            ))}
          </div>
        )}
      </span>
    </div>
  );
};

const Showtimes = () => {
  const navigate = useNavigate();
  const [scheduleEntries, setScheduleEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedCity, setSelectedCity] = useState("all");
  const [selectedTheater, setSelectedTheater] = useState("all");
  const [expandedTheaters, setExpandedTheaters] = useState({});

  useEffect(() => {
    let isCancelled = false;

    const fetchShowtimesPageData = async () => {
      setLoading(true);

      try {
        const moviesResponse = await fetch(
          `${API_ENDPOINTS.MOVIES.GET_ALL}?isShowing=true`
        );

        if (!moviesResponse.ok) {
          throw new Error(`HTTP error: ${moviesResponse.status}`);
        }

        const moviesData = await moviesResponse.json();
        const movies = Array.isArray(moviesData?.data?.movies)
          ? moviesData.data.movies
          : [];

        const scheduleResults = await Promise.allSettled(
          movies.map(async (movie) => {
            const movieId = movie?._id || movie?.id;

            if (!movieId) {
              return null;
            }

            const response = await fetch(
              API_ENDPOINTS.SHOWTIMES.GET_BY_MOVIE(movieId)
            );

            if (!response.ok) {
              return null;
            }

            const data = await response.json();
            const theaterGroups = Array.isArray(data?.data?.showtimes)
              ? data.data.showtimes
              : [];

            const theaterSchedules = theaterGroups
              .map((group) => {
                const theater = group?.theater || {};
                const showtimes = Array.isArray(group?.showtimes)
                  ? group.showtimes
                      .map((showtime) => {
                        const dateKey = getDateKey(showtime?.date);

                        if (!dateKey) {
                          return null;
                        }

                        return {
                          ...showtime,
                          dateKey,
                          timeLabel: formatTime(
                            showtime?.time || showtime?.date
                          ),
                          theater: showtime?.theater || theater,
                        };
                      })
                      .filter(Boolean)
                  : [];

                if (showtimes.length === 0) {
                  return null;
                }

                const theaterId =
                  theater?._id ||
                  `${theater?.name || "theater"}_${
                    theater?.address || "address"
                  }`;

                return {
                  theater: {
                    ...theater,
                    _id: theaterId,
                    city: theater?.city || FALLBACK_CITY,
                  },
                  showtimes,
                };
              })
              .filter(Boolean);

            if (theaterSchedules.length === 0) {
              return null;
            }

            const totalSessions = theaterSchedules.reduce(
              (total, group) => total + group.showtimes.length,
              0
            );

            return {
              movie,
              movieId,
              theaterSchedules,
              totalSessions,
            };
          })
        );

        const normalizedEntries = scheduleResults
          .map((result) =>
            result.status === "fulfilled" ? result.value : null
          )
          .filter(Boolean);

        const finalEntries = normalizedEntries
          .sort((first, second) => {
            if (second.totalSessions !== first.totalSessions) {
              return second.totalSessions - first.totalSessions;
            }

            return (first.movie?.title || "").localeCompare(
              second.movie?.title || ""
            );
          });

        if (!isCancelled) {
          setScheduleEntries(finalEntries);
        }
      } catch (error) {
        console.error("Failed to fetch showtimes page data:", error);

        if (!isCancelled) {
          setScheduleEntries([]);
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    fetchShowtimesPageData();

    return () => {
      isCancelled = true;
    };
  }, []);

  const collectedDateKeys = [];

  scheduleEntries.forEach((entry) => {
    entry.theaterSchedules.forEach((group) => {
      group.showtimes.forEach((showtime) => {
        if (showtime.dateKey && !collectedDateKeys.includes(showtime.dateKey)) {
          collectedDateKeys.push(showtime.dateKey);
        }
      });
    });
  });

  collectedDateKeys.sort();

  const dateOptions = (collectedDateKeys.length
    ? collectedDateKeys.slice(0, 7)
    : getFallbackDateKeys(7)
  ).map((dateKey) => formatDateOption(dateKey));
  const normalizedSelectedDate = dateOptions.some(
    (option) => option.value === selectedDate
  )
    ? selectedDate
    : dateOptions[0]?.value || "";

  const cityOptions = [];

  scheduleEntries.forEach((entry) => {
    entry.theaterSchedules.forEach((group) => {
      const hasSelectedDate = group.showtimes.some(
        (showtime) => showtime.dateKey === normalizedSelectedDate
      );

      if (!hasSelectedDate) {
        return;
      }

      const cityLabel = group.theater?.city || FALLBACK_CITY;

      if (!cityOptions.some((option) => option.value === cityLabel)) {
        cityOptions.push({
          value: cityLabel,
          label: cityLabel,
        });
      }
    });
  });

  cityOptions.sort((first, second) => first.label.localeCompare(second.label));

  const theaterOptions = [];

  scheduleEntries.forEach((entry) => {
    entry.theaterSchedules.forEach((group) => {
      const hasSelectedDate = group.showtimes.some(
        (showtime) => showtime.dateKey === normalizedSelectedDate
      );

      if (!hasSelectedDate) {
        return;
      }

      const cityLabel = group.theater?.city || FALLBACK_CITY;

      if (selectedCity !== "all" && cityLabel !== selectedCity) {
        return;
      }

      const theaterId = group.theater?._id;

      if (!theaterOptions.some((option) => option.value === theaterId)) {
        theaterOptions.push({
          value: theaterId,
          label: group.theater?.name || "Cinema",
        });
      }
    });
  });

  theaterOptions.sort((first, second) =>
    first.label.localeCompare(second.label)
  );

  const filteredEntries = scheduleEntries
    .map((entry) => {
      const visibleTheaters = entry.theaterSchedules
        .map((group) => {
          const cityLabel = group.theater?.city || FALLBACK_CITY;

          if (selectedCity !== "all" && cityLabel !== selectedCity) {
            return null;
          }

          if (
            selectedTheater !== "all" &&
            group.theater?._id !== selectedTheater
          ) {
            return null;
          }

          const showtimes = group.showtimes.filter(
            (showtime) => showtime.dateKey === normalizedSelectedDate
          );

          if (showtimes.length === 0) {
            return null;
          }

          return {
            ...group,
            showtimes,
          };
        })
        .filter(Boolean);

      if (visibleTheaters.length === 0) {
        return null;
      }

      return {
        ...entry,
        theaterSchedules: visibleTheaters,
        visibleSessionCount: visibleTheaters.reduce(
          (total, group) => total + group.showtimes.length,
          0
        ),
      };
    })
    .filter(Boolean);

  const visibleSessionCount = filteredEntries.reduce(
    (total, entry) => total + entry.visibleSessionCount,
    0
  );
  const nextDateValue = normalizedSelectedDate;
  const hasSelectedDate =
    selectedDate === normalizedSelectedDate && Boolean(normalizedSelectedDate);
  const hasSelectedCity =
    selectedCity === "all" ||
    cityOptions.some((option) => option.value === selectedCity);
  const hasSelectedTheater =
    selectedTheater === "all" ||
    theaterOptions.some((option) => option.value === selectedTheater);
  const citySelectOptions = [
    {
      value: "all",
      label: "T\u1EA5t c\u1EA3 th\u00E0nh ph\u1ED1",
    },
    ...cityOptions,
  ];
  const theaterSelectOptions = [
    {
      value: "all",
      label: "T\u1EA5t c\u1EA3 r\u1EA1p",
    },
    ...theaterOptions,
  ];

  useEffect(() => {
    if (!nextDateValue) {
      return;
    }

    if (!hasSelectedDate) {
      setSelectedDate(nextDateValue);
    }
  }, [hasSelectedDate, nextDateValue]);

  useEffect(() => {
    if (!hasSelectedCity) {
      setSelectedCity("all");
    }
  }, [hasSelectedCity]);

  useEffect(() => {
    if (!hasSelectedTheater) {
      setSelectedTheater("all");
    }
  }, [hasSelectedTheater]);

  const handleDateChange = (dateKey) => {
    setSelectedDate(dateKey);
    setSelectedCity("all");
    setSelectedTheater("all");
  };

  const handleOpenMovie = (movieId) => {
    if (!movieId) {
      return;
    }

    navigate(`/movie/${movieId}`);
  };

  const handleOpenBooking = (movieId, showtimeId, dateKey) => {
    const searchParams = new URLSearchParams();
    searchParams.set("showtimeId", showtimeId);
    searchParams.set("date", dateKey);
    navigate(`/booking/${movieId}?${searchParams.toString()}`);
  };

  const getTheaterKey = (movieId, theaterId) => `${movieId}:${theaterId}`;

  const isTheaterExpanded = (movieId, theaterId) => {
    const key = getTheaterKey(movieId, theaterId);
    return expandedTheaters[key] ?? true;
  };

  const toggleTheater = (movieId, theaterId) => {
    const key = getTheaterKey(movieId, theaterId);

    setExpandedTheaters((current) => ({
      ...current,
      [key]: !(current[key] ?? true),
    }));
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="showtimes-page">
      <div className="showtimes-shell">
        <section className="showtimes-hero">
          <h1 className="showtimes-title">
            {"L\u1ECBch chi\u1EBFu t\u1ED5ng h\u1EE3p"}
          </h1>
          <p className="showtimes-subtitle">
            {
              "Ch\u1ECDn su\u1EA5t chi\u1EBFu nhanh tr\u00EAn m\u1ED9t giao di\u1EC7n \u0111\u1ED3ng b\u1ED9 v\u1EDBi t\u00F4ng m\u00E0u \u0111\u1ECF \u0111en c\u1EE7a h\u1EC7 th\u1ED1ng."
            }
          </p>
        </section>

        <section className="showtimes-toolbar">
          <div className="showtimes-date-strip">
            {dateOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                className={`showtimes-date-pill ${
                  normalizedSelectedDate === option.value ? "active" : ""
                }`}
                onClick={() => handleDateChange(option.value)}
              >
                <span>{option.topLabel}</span>
                <strong>{option.bottomLabel}</strong>
              </button>
            ))}
          </div>

          <div className="showtimes-filter-row">
            <CustomSelect
              icon={<FaMapMarkerAlt />}
              label={"Th\u00E0nh ph\u1ED1"}
              value={selectedCity}
              options={citySelectOptions}
              onChange={(nextValue) => {
                setSelectedCity(nextValue);
                setSelectedTheater("all");
              }}
            />

            <CustomSelect
              icon={<FiCalendar />}
              label={"R\u1EA1p"}
              value={selectedTheater}
              options={theaterSelectOptions}
              onChange={(nextValue) => setSelectedTheater(nextValue)}
            />

            <div className="showtimes-summary">
              {"Hi\u1EC3n th\u1ECB"} {filteredEntries.length} phim{" "}
              {"v\u1EDBi"} {visibleSessionCount} {"su\u1EA5t chi\u1EBFu"}
            </div>
          </div>
        </section>

        <section className="showtimes-list">
          {filteredEntries.length > 0 ? (
            filteredEntries.map((entry) => {
              const movie = entry.movie || {};
              const genreText =
                Array.isArray(movie.genre) && movie.genre.length > 0
                  ? movie.genre.join(" / ")
                  : "\u0110ang chi\u1EBFu";
              const description =
                movie.description ||
                "Ch\u1ECDn khung gi\u1EDD ph\u00F9 h\u1EE3p v\u00E0 \u0111i th\u1EB3ng \u0111\u1EBFn b\u01B0\u1EDBc \u0111\u1EB7t v\u00E9.";

              return (
                <article key={entry.movieId} className="showtimes-card">
                  <div className="showtimes-poster-column">
                    <span
                      className={`showtimes-age-tag ${getAgeTagClass(
                        movie.ageRating
                      )}`}
                    >
                      {movie.ageRating || "K"}
                    </span>
                    <img
                      src={movie.poster || FALLBACK_POSTER}
                      alt={movie.title || "Movie poster"}
                      className="showtimes-poster"
                      onError={(event) => {
                        event.currentTarget.src = FALLBACK_POSTER;
                      }}
                    />
                  </div>

                  <div className="showtimes-card-content">
                    <div className="showtimes-card-header">
                      <div>
                        <h2>{movie.title || "Cinema title"}</h2>
                        <div className="showtimes-meta">
                          <span>
                            <FaStar />
                            {movie.rating ? movie.rating.toFixed(1) : "N/A"}
                          </span>
                          <span>
                            <FaClock />
                            {movie.duration || 0} {"ph\u00FAt"}
                          </span>
                          <span>
                            <FaTicketAlt />
                            {entry.visibleSessionCount} {"su\u1EA5t"}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        className="showtimes-detail-btn"
                        onClick={() => handleOpenMovie(entry.movieId)}
                      >
                        Xem phim
                      </button>
                    </div>

                    <p className="showtimes-genre-line">{genreText}</p>
                    <p className="showtimes-description">{description}</p>

                    <div className="showtimes-theater-list">
                      {entry.theaterSchedules.map((group) => {
                        const theaterId = group.theater?._id || "theater";
                        const expanded = isTheaterExpanded(
                          entry.movieId,
                          theaterId
                        );

                        return (
                          <div
                            key={`${theaterId}_${entry.movieId}`}
                            className="showtimes-theater-block"
                          >
                            <button
                              type="button"
                              className={`showtimes-theater-toggle ${
                                expanded ? "expanded" : ""
                              }`}
                              onClick={() =>
                                toggleTheater(entry.movieId, theaterId)
                              }
                              aria-expanded={expanded}
                            >
                              <div className="showtimes-theater-head">
                                <div className="showtimes-theater-title">
                                  <h3>{group.theater?.name || "Cinema"}</h3>
                                </div>
                                <p>
                                  {group.theater?.address ||
                                    group.theater?.city}
                                </p>
                              </div>
                              <span className="showtimes-theater-arrow">
                                <FiChevronDown />
                              </span>
                            </button>

                            {expanded && (
                              <div className="showtimes-theater-panel">
                                <div className="showtimes-time-grid">
                                  {group.showtimes.map((showtime) => (
                                    <button
                                      key={showtime._id}
                                      type="button"
                                      className="showtime-chip"
                                      onClick={() =>
                                        handleOpenBooking(
                                          entry.movieId,
                                          showtime._id,
                                          showtime.dateKey
                                        )
                                      }
                                      title={`${formatTime(showtime.time)} - ${
                                        showtime.availableSeats ?? 0
                                      } gh\u1EBF tr\u1ED1ng`}
                                    >
                                      <span>{showtime.timeLabel}</span>
                                      <small>
                                        {showtime.availableSeats ?? 0}{" "}
                                        {"gh\u1EBF"}
                                      </small>
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </article>
              );
            })
          ) : (
            <div className="showtimes-empty-state">
              <h2>{"Ch\u01B0a c\u00F3 su\u1EA5t chi\u1EBFu ph\u00F9 h\u1EE3p"}</h2>
              <p>
                {
                  "Th\u1EED \u0111\u1ED5i ng\u00E0y ho\u1EB7c b\u1ED9 l\u1ECDc kh\u00E1c. N\u1EBFu d\u1EEF li\u1EC7u v\u1EEBa \u0111\u01B0\u1EE3c c\u1EADp nh\u1EADt, trang s\u1EBD hi\u1EC3n th\u1ECB ngay khi API tr\u1EA3 v\u1EC1 l\u1ECBch chi\u1EBFu."
                }
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default Showtimes;
